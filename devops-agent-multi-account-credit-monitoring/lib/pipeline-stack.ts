import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStackProps, AppConfig } from './types';
import { MonitoringStage } from './stages/monitoring-stage';
import { SourceAccountStage } from './stages/source-account-stage';
import { calculateThresholds } from './credit-calculator';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { pipelineConfig, appConfig } = props;
    const branch = pipelineConfig.branch ?? 'main';

    // Reference existing CodeCommit repository
    const repo = codecommit.Repository.fromRepositoryName(
      this,
      'Repo',
      pipelineConfig.repositoryName,
    );

    // Define the pipeline
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'DevOpsAgent-CreditMonitor-Pipeline',
      synth: new CodeBuildStep('Synth', {
        input: CodePipelineSource.codeCommit(repo, branch),
        commands: [
          'npm ci',
          'npm run build',
          'npm test',
          'npx cdk synth',
        ],
      }),
      crossAccountKeys: true,
    });

    // Compute thresholds for stage props
    const thresholds = calculateThresholds(appConfig.billing, appConfig.alerts);

    // Stage 1: Deploy MonitoringStack to the monitoring account
    const monitoringStage = new MonitoringStage(this, 'MonitoringStage', {
      env: {
        account: appConfig.monitoringAccount.accountId,
        region: appConfig.monitoringAccount.region,
      },
      thresholds,
      alerts: appConfig.alerts,
      sourceAccounts: appConfig.sourceAccounts,
      orgId: appConfig.orgId,
      dashboardEnabled: appConfig.dashboardEnabled ?? true,
    });
    pipeline.addStage(monitoringStage);

    // Stage 2: Deploy SourceStacks to each source account
    // Note: Sink ARN is passed via SSM parameter written by MonitoringStack
    const ssmParamName = '/devops-agent-monitoring/sink-arn';
    for (const sourceAccount of appConfig.sourceAccounts) {
      const stage = new SourceAccountStage(this, `SourceStage-${sourceAccount.accountId}`, {
        env: {
          account: sourceAccount.accountId,
          region: sourceAccount.region,
        },
        ssmParameterName: ssmParamName,
      });
      pipeline.addStage(stage);
    }
  }
}
