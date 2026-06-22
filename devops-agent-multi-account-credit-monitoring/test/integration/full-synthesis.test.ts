import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../../lib/monitoring-stack';
import { SourceStack } from '../../lib/source-stack';
import { validateConfig } from '../../lib/config-validator';
import { calculateThresholds } from '../../lib/credit-calculator';

const config = {
  monitoringAccount: { accountId: '123456789012', region: 'us-east-1' },
  sourceAccounts: [
    { accountId: '111111111111', region: 'us-east-1' },
    { accountId: '222222222222', region: 'us-west-2' },
  ],
  billing: { enterpriseSupportMonthlyFee: 15000, creditPercentage: 75, ratePerAgentSecond: 0.0083 },
  alerts: { email: 'test@example.com', warningPercent: 75, criticalPercent: 100, enableForecastedAlarm: true },
  dashboardEnabled: true,
};

describe('Full CDK Synthesis Integration Tests', () => {
  describe('Full synthesis produces valid CloudFormation', () => {
    it('should synthesize without errors and produce correct number of stacks', () => {
      const app = new cdk.App();
      const validatedConfig = validateConfig(config);
      const thresholds = calculateThresholds(validatedConfig.billing, validatedConfig.alerts);

      const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
        env: {
          account: validatedConfig.monitoringAccount.accountId,
          region: validatedConfig.monitoringAccount.region,
        },
        thresholds,
        alerts: validatedConfig.alerts,
        sourceAccounts: validatedConfig.sourceAccounts,
        dashboardEnabled: validatedConfig.dashboardEnabled!,
      });

      const sourceStacks = validatedConfig.sourceAccounts.map(
        (account) =>
          new SourceStack(app, `SourceStack-${account.accountId}`, {
            env: { account: account.accountId, region: account.region },
            sinkArn: monitoringStack.sink.attrArn,
          })
      );

      // Synthesis should not throw
      const assembly = app.synth();

      // 1 monitoring + 2 source = 3 stacks
      expect(assembly.stacks.length).toBe(3);
    });
  });

  describe('Cross-stack reference resolution', () => {
    it('should allow SourceStack to reference MonitoringStack sink ARN', () => {
      const app = new cdk.App();
      const validatedConfig = validateConfig(config);
      const thresholds = calculateThresholds(validatedConfig.billing, validatedConfig.alerts);

      const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
        env: {
          account: validatedConfig.monitoringAccount.accountId,
          region: validatedConfig.monitoringAccount.region,
        },
        thresholds,
        alerts: validatedConfig.alerts,
        sourceAccounts: validatedConfig.sourceAccounts,
        dashboardEnabled: validatedConfig.dashboardEnabled!,
      });

      const sourceStack = new SourceStack(app, 'SourceStack-111111111111', {
        env: { account: '111111111111', region: 'us-east-1' },
        sinkArn: monitoringStack.sink.attrArn,
      });

      // Synthesis should succeed with cross-stack reference
      const assembly = app.synth();

      // Verify the source stack template contains an OAM Link
      const sourceTemplate = Template.fromStack(sourceStack);
      sourceTemplate.hasResourceProperties('AWS::Oam::Link', {
        ResourceTypes: ['AWS::CloudWatch::Metric'],
      });
    });
  });

  describe('Multi-account environment targeting', () => {
    it('should target each stack to the correct account and region from config', () => {
      const app = new cdk.App();
      const validatedConfig = validateConfig(config);
      const thresholds = calculateThresholds(validatedConfig.billing, validatedConfig.alerts);

      const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
        env: {
          account: validatedConfig.monitoringAccount.accountId,
          region: validatedConfig.monitoringAccount.region,
        },
        thresholds,
        alerts: validatedConfig.alerts,
        sourceAccounts: validatedConfig.sourceAccounts,
        dashboardEnabled: validatedConfig.dashboardEnabled!,
      });

      const sourceStack1 = new SourceStack(app, 'SourceStack-111111111111', {
        env: { account: '111111111111', region: 'us-east-1' },
        sinkArn: monitoringStack.sink.attrArn,
      });

      const sourceStack2 = new SourceStack(app, 'SourceStack-222222222222', {
        env: { account: '222222222222', region: 'us-west-2' },
        sinkArn: monitoringStack.sink.attrArn,
      });

      app.synth();

      // Verify monitoring stack targets the monitoring account
      expect(monitoringStack.account).toBe('123456789012');
      expect(monitoringStack.region).toBe('us-east-1');

      // Verify each source stack targets its respective account/region
      expect(sourceStack1.account).toBe('111111111111');
      expect(sourceStack1.region).toBe('us-east-1');

      expect(sourceStack2.account).toBe('222222222222');
      expect(sourceStack2.region).toBe('us-west-2');
    });
  });

  describe('Conditional resource inclusion', () => {
    it('should synthesize without forecasted alarm and dashboard when disabled', () => {
      const disabledConfig = {
        ...config,
        alerts: { ...config.alerts, enableForecastedAlarm: false },
        dashboardEnabled: false,
      };

      const app = new cdk.App();
      const validatedConfig = validateConfig(disabledConfig);
      const thresholds = calculateThresholds(validatedConfig.billing, validatedConfig.alerts);

      const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
        env: {
          account: validatedConfig.monitoringAccount.accountId,
          region: validatedConfig.monitoringAccount.region,
        },
        thresholds,
        alerts: validatedConfig.alerts,
        sourceAccounts: validatedConfig.sourceAccounts,
        dashboardEnabled: validatedConfig.dashboardEnabled!,
      });

      app.synth();

      const template = Template.fromStack(monitoringStack);

      // Warning and critical alarms should still be present
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);

      // Dashboard should be absent
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
    });
  });
});
