import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MonitoringStack } from '../monitoring-stack';
import { AlertsConfig, AccountConfig, CreditThresholds } from '../types';

export interface MonitoringStageProps extends cdk.StageProps {
  thresholds: CreditThresholds;
  alerts: AlertsConfig;
  sourceAccounts: AccountConfig[];
  orgId?: string;
  dashboardEnabled: boolean;
}

export class MonitoringStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: MonitoringStageProps) {
    super(scope, id, props);

    new MonitoringStack(this, 'MonitoringStack', {
      thresholds: props.thresholds,
      alerts: props.alerts,
      sourceAccounts: props.sourceAccounts,
      orgId: props.orgId,
      dashboardEnabled: props.dashboardEnabled,
    });
  }
}
