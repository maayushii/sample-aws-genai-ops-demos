import * as fc from 'fast-check';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../../lib/monitoring-stack';
import { SourceStack } from '../../lib/source-stack';

const thresholds = { monthlyCredit: 11250, totalAgentSeconds: 1355421, warningThreshold: 1016565, criticalThreshold: 1355421 };
const alerts = { email: 'test@example.com', warningPercent: 75, criticalPercent: 100, enableForecastedAlarm: true };

describe('stack-instantiation property tests', () => {
  /**
   * Property 9: Per-account dashboard breakdown includes all accounts
   *
   * For any random array of 1-10 source accounts (unique accountId+region combos,
   * accountIds are 12-digit numeric strings), instantiating MonitoringStack with
   * dashboardEnabled: true and synthesizing the template should produce a Dashboard
   * resource body that contains a reference to each source account's accountId.
   *
   * **Validates: Requirements 1.2**
   */
  it('Property 9: Per-account dashboard breakdown includes all accounts', () => {
    const sourceAccountArb = fc.uniqueArray(
      fc.record({
        accountId: fc.stringMatching(/^[0-9]{12}$/),
        region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
      }),
      {
        minLength: 1,
        maxLength: 10,
        comparator: (a, b) => a.accountId === b.accountId && a.region === b.region,
      }
    );

    fc.assert(
      fc.property(sourceAccountArb, (sourceAccounts) => {
        const app = new cdk.App();
        const stack = new MonitoringStack(app, 'TestStack', {
          thresholds,
          alerts,
          sourceAccounts,
          dashboardEnabled: true,
        });

        const template = Template.fromStack(stack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');

        const dashboardKeys = Object.keys(dashboards);
        expect(dashboardKeys.length).toBeGreaterThan(0);

        const dashboardBody = JSON.stringify(dashboards);

        for (const account of sourceAccounts) {
          expect(dashboardBody).toContain(account.accountId);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Source account list produces correct stack count
   *
   * For any random array of 1-20 source accounts (unique accountId+region combos,
   * accountIds are 12-digit numeric strings), instantiating MonitoringStack + one
   * SourceStack per account should produce exactly N SourceStack instances, and each
   * SourceStack's env should match its account config.
   *
   * **Validates: Requirements 1.2**
   */
  it('Property 6: Source account list produces correct stack count', () => {
    const sourceAccountArb = fc.uniqueArray(
      fc.record({
        accountId: fc.stringMatching(/^[0-9]{12}$/),
        region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
      }),
      {
        minLength: 1,
        maxLength: 20,
        comparator: (a, b) => a.accountId === b.accountId && a.region === b.region,
      }
    );

    fc.assert(
      fc.property(sourceAccountArb, (sourceAccounts) => {
        const app = new cdk.App();
        const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
          thresholds,
          alerts,
          sourceAccounts,
          dashboardEnabled: true,
        });
        const sourceStacks = sourceAccounts.map(sa =>
          new SourceStack(app, `SourceStack-${sa.accountId}`, {
            env: { account: sa.accountId, region: sa.region },
            sinkArn: 'arn:aws:oam:us-east-1:123456789012:sink/test',
          })
        );

        // Verify exactly N SourceStack instances are created
        expect(sourceStacks.length).toBe(sourceAccounts.length);

        // Verify each SourceStack's env matches its account config
        for (let i = 0; i < sourceAccounts.length; i++) {
          expect(sourceStacks[i].account).toBe(sourceAccounts[i].accountId);
          expect(sourceStacks[i].region).toBe(sourceAccounts[i].region);
        }

        // Verify the app has the correct number of children (MonitoringStack + N SourceStacks)
        const stackChildren = app.node.children.filter(c => c instanceof cdk.Stack);
        expect(stackChildren.length).toBe(sourceAccounts.length + 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Unique stack names incorporate accountId
   *
   * For any random array of 2-10 accounts (unique accountId+region combos,
   * accountIds are 12-digit numeric strings), creating stacks with names
   * `SourceStack-${accountId}` should produce all unique stack names, and each
   * stack name should contain its accountId.
   *
   * **Validates: Requirements 1.2**
   */
  it('Property 7: Unique stack names incorporate accountId', () => {
    const sourceAccountArb = fc.uniqueArray(
      fc.record({
        accountId: fc.stringMatching(/^[0-9]{12}$/),
        region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
      }),
      {
        minLength: 2,
        maxLength: 10,
        comparator: (a, b) => a.accountId === b.accountId && a.region === b.region,
      }
    );

    fc.assert(
      fc.property(sourceAccountArb, (sourceAccounts) => {
        const app = new cdk.App();
        const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
          thresholds,
          alerts,
          sourceAccounts,
          dashboardEnabled: true,
        });
        const sourceStacks = sourceAccounts.map(sa =>
          new SourceStack(app, `SourceStack-${sa.accountId}`, {
            env: { account: sa.accountId, region: sa.region },
            sinkArn: 'arn:aws:oam:us-east-1:123456789012:sink/test',
          })
        );

        const stackNames = sourceStacks.map(s => s.stackName);

        // Verify all stack names are unique
        const uniqueNames = new Set(stackNames);
        expect(uniqueNames.size).toBe(stackNames.length);

        // Verify each stack name contains its accountId
        for (let i = 0; i < sourceAccounts.length; i++) {
          expect(stackNames[i]).toContain(sourceAccounts[i].accountId);
        }
      }),
      { numRuns: 100 }
    );
  });
});
