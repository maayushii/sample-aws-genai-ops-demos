import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as oam from 'aws-cdk-lib/aws-oam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { MonitoringStackProps } from './types';

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly sink: oam.CfnSink;
  public readonly usageCheckerFn: lambda.Function;
  public readonly dashboard?: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Build sink policy based on whether orgId is provided
    const sinkPolicy = props.orgId
      ? this.buildOrgScopedPolicy(props.orgId)
      : this.buildAccountScopedPolicy(props.sourceAccounts);

    // Create OAM Sink
    this.sink = new oam.CfnSink(this, 'OamSink', {
      name: 'DevOpsAgent-MetricsSink',
      policy: sinkPolicy,
    });

    // Export Sink ARN as CloudFormation output
    new cdk.CfnOutput(this, 'SinkArn', {
      value: this.sink.attrArn,
      description: 'The ARN of the OAM Sink for cross-account metric sharing',
      exportName: 'SinkArn',
    });

    // Store Sink ARN in SSM for cross-account pipeline reference
    new ssm.StringParameter(this, 'SinkArnParameter', {
      parameterName: '/devops-agent/credit-monitor/sink-arn',
      stringValue: this.sink.attrArn,
      description: 'OAM Sink ARN for source account OAM Links',
    });

    // Create SNS Topic for alarm notifications
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'DevOps Agent Credit Alerts',
      enforceSSL: true,
    });

    // Add email subscription
    this.alertTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(props.alerts.email)
    );

    // Usage Checker Lambda - runs hourly, queries real cumulative usage
    this.usageCheckerFn = new lambda.Function(this, 'UsageCheckerFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'usage-checker')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        WARNING_THRESHOLD: props.thresholds.warningThreshold.toString(),
        CRITICAL_THRESHOLD: props.thresholds.criticalThreshold.toString(),
        TOTAL_AGENT_SECONDS: props.thresholds.totalAgentSeconds.toString(),
        SNS_TOPIC_ARN: this.alertTopic.topicArn,
      },
    });

    // Grant permissions
    this.usageCheckerFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:GetMetricData', 'cloudwatch:PutMetricData'],
      resources: ['*'],
    }));
    this.alertTopic.grantPublish(this.usageCheckerFn);

    // Schedule: run every hour
    const rule = new events.Rule(this, 'UsageCheckerSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
    });
    rule.addTarget(new targets.LambdaFunction(this.usageCheckerFn, {
      event: events.RuleTargetInput.fromObject({
        warningThreshold: props.thresholds.warningThreshold,
        criticalThreshold: props.thresholds.criticalThreshold,
        totalAgentSeconds: props.thresholds.totalAgentSeconds,
        snsTopicArn: this.alertTopic.topicArn,
        sourceAccounts: props.sourceAccounts.map(a => a.accountId),
        monitoringAccountId: props.env?.account ?? 'unknown',
        region: props.env?.region ?? 'us-east-1',
      }),
    }));

    // cdk-nag suppressions
    NagSuppressions.addResourceSuppressions(this.usageCheckerFn, [
      { id: 'AwsSolutions-IAM4', reason: 'Lambda basic execution role required for CloudWatch Logs' },
      { id: 'AwsSolutions-IAM5', reason: 'cloudwatch:GetMetricData and PutMetricData require Resource: * as metrics are dynamic' },
      { id: 'AwsSolutions-L1', reason: 'NODEJS_20_X is the latest runtime supporting inline AWS SDK v3' },
    ], true);

    // CloudWatch Dashboard (conditional)
    if (props.dashboardEnabled) {
      this.dashboard = this.createDashboard(props);
    }
  }

  private createDashboard(props: MonitoringStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'DevOpsAgent-CreditDashboard',
      defaultInterval: cdk.Duration.days(30),
    });

    // Row 1: Monthly Usage Total (from custom metric) + Usage Percent
    const monthlyUsageMetric = new cloudwatch.Metric({
      namespace: 'DevOpsAgent/CreditUsage',
      metricName: 'MonthlyUsageTotal',
      statistic: 'Maximum',
      period: cdk.Duration.hours(1),
    });

    const usagePercentMetric = new cloudwatch.Metric({
      namespace: 'DevOpsAgent/CreditUsage',
      metricName: 'MonthlyUsagePercent',
      statistic: 'Maximum',
      period: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Monthly Usage (seconds)',
        metrics: [monthlyUsageMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GaugeWidget({
        title: 'Credit Usage %',
        metrics: [usagePercentMetric],
        width: 8,
        height: 6,
        leftYAxis: { min: 0, max: 100 },
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Thresholds',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'DevOpsAgent/CreditUsage',
            metricName: 'MonthlyUsageTotal',
            statistic: 'Maximum',
            period: cdk.Duration.hours(1),
            label: `Warning: ${props.thresholds.warningThreshold.toLocaleString()}s | Critical: ${props.thresholds.criticalThreshold.toLocaleString()}s | Total: ${props.thresholds.totalAgentSeconds.toLocaleString()}s`,
          }),
        ],
        width: 8,
        height: 6,
      }),
    );

    // Row 2: Daily Usage Trend (stacked area)
    const investigationMetric = new cloudwatch.MathExpression({
      expression: "SEARCH('{AWS/AIDevOps} MetricName=\"ConsumedInvestigationTime\"', 'Sum', 86400)",
      label: 'ConsumedInvestigationTime',
      usingMetrics: {},
    });

    const evaluationMetric = new cloudwatch.MathExpression({
      expression: "SEARCH('{AWS/AIDevOps} MetricName=\"ConsumedEvaluationTime\"', 'Sum', 86400)",
      label: 'ConsumedEvaluationTime',
      usingMetrics: {},
    });

    const onDemandMetric = new cloudwatch.MathExpression({
      expression: "SEARCH('{AWS/AIDevOps} MetricName=\"ConsumedOnDemandTime\"', 'Sum', 86400)",
      label: 'ConsumedOnDemandTime',
      usingMetrics: {},
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Daily Usage Trend',
        width: 24,
        height: 6,
        stacked: true,
        left: [investigationMetric, evaluationMetric, onDemandMetric],
        leftAnnotations: [
          { value: props.thresholds.warningThreshold, label: 'Warning (monthly)', color: '#ff7f0e' },
          { value: props.thresholds.criticalThreshold, label: 'Critical (monthly)', color: '#d62728' },
        ],
      }),
    );

    // Row 3: Cumulative Usage Over Time (from custom metric)
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cumulative Monthly Usage',
        width: 24,
        height: 6,
        left: [monthlyUsageMetric],
        leftAnnotations: [
          { value: props.thresholds.warningThreshold, label: 'Warning', color: '#ff7f0e' },
          { value: props.thresholds.criticalThreshold, label: 'Critical', color: '#d62728' },
          { value: props.thresholds.totalAgentSeconds, label: 'Total Credit', color: '#2ca02c' },
        ],
      }),
    );

    // Row 4: Per-Account Breakdown - uses SEARCH grouped by AgentSpaceUUID
    const perAccountMetric = new cloudwatch.MathExpression({
      expression: "SEARCH('{AWS/AIDevOps,AgentSpaceUUID} MetricName=\"ConsumedInvestigationTime\" OR MetricName=\"ConsumedEvaluationTime\" OR MetricName=\"ConsumedOnDemandTime\"', 'Sum', 2592000)",
      label: 'Per AgentSpace',
      usingMetrics: {},
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Per-Account Breakdown (by AgentSpace)',
        width: 24,
        height: 6,
        left: [perAccountMetric],
      }),
    );

    return dashboard;
  }

  private buildOrgScopedPolicy(orgId: string): object {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['oam:CreateLink', 'oam:UpdateLink'],
          Resource: '*',
          Condition: {
            'ForAllValues:StringEquals': {
              'oam:ResourceTypes': ['AWS::CloudWatch::Metric'],
            },
            StringEquals: {
              'aws:PrincipalOrgID': orgId,
            },
          },
        },
      ],
    };
  }

  private buildAccountScopedPolicy(sourceAccounts: { accountId: string; region: string }[]): object {
    const principals = sourceAccounts.map(
      (account) => `arn:aws:iam::${account.accountId}:root`
    );

    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: principals },
          Action: ['oam:CreateLink', 'oam:UpdateLink'],
          Resource: '*',
          Condition: {
            'ForAllValues:StringEquals': {
              'oam:ResourceTypes': ['AWS::CloudWatch::Metric'],
            },
          },
        },
      ],
    };
  }
}
