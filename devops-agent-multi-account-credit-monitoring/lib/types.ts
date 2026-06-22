import * as cdk from 'aws-cdk-lib';

export interface AccountConfig {
  accountId: string;  // 12-digit numeric string
  region: string;     // valid AWS region
}

export interface BillingConfig {
  enterpriseSupportMonthlyFee: number;  // required, positive
  creditPercentage?: number;            // 1-100, default 75
  ratePerAgentSecond?: number;          // positive, default 0.0083
}

export interface AlertsConfig {
  email: string;                    // required, non-empty
  warningPercent?: number;          // 1-99, default 75
  criticalPercent?: number;         // >= warningPercent, default 100
  enableForecastedAlarm?: boolean;  // default true
}

export interface AppConfig {
  monitoringAccount: AccountConfig;
  sourceAccounts: AccountConfig[];
  billing: BillingConfig;
  alerts: AlertsConfig;
  orgId?: string;
  dashboardEnabled?: boolean;
}

export interface CreditThresholds {
  monthlyCredit: number;
  totalAgentSeconds: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface MonitoringStackProps extends cdk.StackProps {
  thresholds: CreditThresholds;
  alerts: AlertsConfig;
  sourceAccounts: AccountConfig[];
  orgId?: string;
  dashboardEnabled: boolean;
}

export interface SourceStackProps extends cdk.StackProps {
  sinkArn?: string;
  ssmParameterName?: string;
}

export interface PipelineConfig {
  repositoryName: string;       // CodeCommit repository name
  branch?: string;              // default: 'main'
}

export interface PipelineStackProps extends cdk.StackProps {
  pipelineConfig: PipelineConfig;
  appConfig: AppConfig;
}
