import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../../lib/monitoring-stack';
import { MonitoringStackProps } from '../../lib/types';

function createTestStack(overrides: Partial<MonitoringStackProps> = {}): Template {
  const app = new cdk.App();

  const testProps: MonitoringStackProps = {
    thresholds: {
      monthlyCredit: 11250,
      totalAgentSeconds: 1355421,
      warningThreshold: 1016565,
      criticalThreshold: 1355421,
    },
    alerts: {
      email: 'test@example.com',
      warningPercent: 75,
      criticalPercent: 100,
      enableForecastedAlarm: true,
    },
    sourceAccounts: [{ accountId: '111111111111', region: 'us-east-1' }],
    dashboardEnabled: true,
    ...overrides,
  };

  const stack = new MonitoringStack(app, 'TestMonitoringStack', testProps);
  return Template.fromStack(stack);
}

describe('MonitoringStack', () => {
  describe('OAM Sink', () => {
    it('contains OAM Sink with correct name', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::Oam::Sink', {
        Name: 'DevOpsAgent-MetricsSink',
      });
    });
  });

  describe('SNS Topic and Subscription', () => {
    it('contains SNS Topic', () => {
      const template = createTestStack();

      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    it('contains email subscription with correct protocol', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });
  });

  describe('Warning Alarm', () => {
    it('has correct threshold', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Warning-UsageThreshold',
        Threshold: 1016565,
      });
    });

    it('has SEARCH expression in metrics', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Warning-UsageThreshold',
        Metrics: Match.arrayWith([
          Match.objectLike({
            Id: 'm1',
            Expression: Match.stringLikeRegexp('SEARCH'),
          }),
        ]),
      });
    });
  });

  describe('Critical Alarm', () => {
    it('has correct threshold', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Critical-UsageThreshold',
        Threshold: 1355421,
      });
    });
  });

  describe('Forecasted Alarm', () => {
    it('is present when enableForecastedAlarm is true', () => {
      const template = createTestStack({
        alerts: {
          email: 'test@example.com',
          warningPercent: 75,
          criticalPercent: 100,
          enableForecastedAlarm: true,
        },
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Forecasted-MonthEnd',
      });
    });

    it('is absent when enableForecastedAlarm is false', () => {
      const template = createTestStack({
        alerts: {
          email: 'test@example.com',
          warningPercent: 75,
          criticalPercent: 100,
          enableForecastedAlarm: false,
        },
      });

      // With forecasted alarm disabled, we should only have 2 alarms (warning + critical)
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Dashboard', () => {
    it('is present when dashboardEnabled is true', () => {
      const template = createTestStack({ dashboardEnabled: true });

      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    it('is absent when dashboardEnabled is false', () => {
      const template = createTestStack({ dashboardEnabled: false });

      template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
    });
  });

  describe('Alarm Actions', () => {
    it('alarm actions reference SNS Topic ARN', () => {
      const template = createTestStack();

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Warning-UsageThreshold',
        AlarmActions: Match.arrayWith([
          Match.objectLike({ Ref: Match.anyValue() }),
        ]),
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'DevOpsAgent-Critical-UsageThreshold',
        AlarmActions: Match.arrayWith([
          Match.objectLike({ Ref: Match.anyValue() }),
        ]),
      });
    });
  });
});
