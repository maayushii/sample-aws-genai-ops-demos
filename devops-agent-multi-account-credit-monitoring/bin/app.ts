#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { validateConfig } from '../lib/config-validator';
import { calculateThresholds } from '../lib/credit-calculator';
import { MonitoringStack } from '../lib/monitoring-stack';
import { SourceStack } from '../lib/source-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Read and validate configuration from CDK context
const rawConfig = {
  monitoringAccount: app.node.tryGetContext('monitoringAccount'),
  sourceAccounts: app.node.tryGetContext('sourceAccounts'),
  billing: app.node.tryGetContext('billing'),
  alerts: app.node.tryGetContext('alerts'),
  orgId: app.node.tryGetContext('orgId'),
  dashboardEnabled: app.node.tryGetContext('dashboardEnabled'),
};

const config = validateConfig(rawConfig);

// Check if pipeline mode is enabled
const pipelineConfig = app.node.tryGetContext('pipeline');

if (pipelineConfig && pipelineConfig.repositoryName) {
  // Pipeline mode: deploy via CodePipeline (self-mutating)
  // Note: cdk-nag is applied inside the pipeline stages during synth
  new PipelineStack(app, 'PipelineStack', {
    env: { account: config.monitoringAccount.accountId, region: config.monitoringAccount.region },
    pipelineConfig: {
      repositoryName: pipelineConfig.repositoryName,
      branch: pipelineConfig.branch,
    },
    appConfig: config,
  });
} else {
  // Direct mode: deploy stacks directly (cdk deploy --all)
  const thresholds = calculateThresholds(config.billing, config.alerts);

  const monitoringStack = new MonitoringStack(app, 'DevOpsAgent-MonitorAccount', {
    env: { account: config.monitoringAccount.accountId, region: config.monitoringAccount.region },
    thresholds,
    alerts: config.alerts,
    sourceAccounts: config.sourceAccounts,
    orgId: config.orgId,
    dashboardEnabled: config.dashboardEnabled ?? true,
  });

  for (const sourceAccount of config.sourceAccounts) {
    new SourceStack(app, `DevOpsAgent-SourceAccount-${sourceAccount.accountId}`, {
      env: { account: sourceAccount.accountId, region: sourceAccount.region },
      sinkArn: monitoringStack.sink.attrArn,
    });
  }

  // Apply cdk-nag only in direct mode (pipeline mode handles its own synth)
  Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
}
