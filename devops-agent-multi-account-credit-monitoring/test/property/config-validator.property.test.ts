import * as fc from 'fast-check';
import { validateConfig } from '../../lib/config-validator';

/**
 * Helper: returns a valid base config object that passes validation.
 */
function validBaseConfig() {
  return {
    monitoringAccount: {
      accountId: '123456789012',
      region: 'us-east-1',
    },
    sourceAccounts: [
      { accountId: '210987654321', region: 'us-west-2' },
    ],
    billing: {
      enterpriseSupportMonthlyFee: 15000,
      creditPercentage: 75,
      ratePerAgentSecond: 0.0083,
    },
    alerts: {
      email: 'ops@example.com',
      warningPercent: 75,
      criticalPercent: 100,
      enableForecastedAlarm: true,
    },
    dashboardEnabled: true,
  };
}

describe('config-validator property tests', () => {
  /**
   * Property 2: Invalid numeric parameters are rejected
   * **Validates: Requirements 3.5, 3.6, 3.7, 3.8, 3.9, 10.5, 10.6**
   */
  describe('Property 2: Invalid numeric parameters are rejected', () => {
    it('rejects creditPercentage outside [1, 100]', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.integer({ min: 101 })
          ),
          (invalidCredit) => {
            const config = validBaseConfig();
            config.billing.creditPercentage = invalidCredit;
            expect(() => validateConfig(config)).toThrow(/creditPercentage/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects warningPercent outside [1, 99]', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.integer({ min: 100 })
          ),
          (invalidWarning) => {
            const config = validBaseConfig();
            config.alerts.warningPercent = invalidWarning;
            // Ensure criticalPercent is still valid and >= warningPercent won't mask the error
            config.alerts.criticalPercent = 100;
            expect(() => validateConfig(config)).toThrow(/warningPercent/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects criticalPercent outside [1, 100]', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.integer({ min: 101 })
          ),
          (invalidCritical) => {
            const config = validBaseConfig();
            config.alerts.criticalPercent = invalidCritical;
            expect(() => validateConfig(config)).toThrow(/criticalPercent/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects criticalPercent < warningPercent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 99 }),
          (warningPercent) => {
            const config = validBaseConfig();
            config.alerts.warningPercent = warningPercent;
            // criticalPercent must be in [1, 100] but < warningPercent
            config.alerts.criticalPercent = warningPercent - 1;
            expect(() => validateConfig(config)).toThrow(/criticalPercent/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Default values are correctly applied
   * **Validates: Requirements 2.4, 2.5, 2.6, 2.7**
   */
  describe('Property 3: Default values are correctly applied', () => {
    it('applies defaults for random subsets of optional fields omitted', () => {
      const optionalFields = [
        'creditPercentage',
        'ratePerAgentSecond',
        'warningPercent',
        'criticalPercent',
        'enableForecastedAlarm',
        'dashboardEnabled',
      ] as const;

      fc.assert(
        fc.property(
          fc.subarray(optionalFields as unknown as string[], { minLength: 1 }),
          (fieldsToOmit) => {
            const config: Record<string, any> = {
              monitoringAccount: {
                accountId: '123456789012',
                region: 'us-east-1',
              },
              sourceAccounts: [
                { accountId: '210987654321', region: 'us-west-2' },
              ],
              billing: {
                enterpriseSupportMonthlyFee: 15000,
                creditPercentage: 50,
                ratePerAgentSecond: 0.01,
              },
              alerts: {
                email: 'ops@example.com',
                warningPercent: 60,
                criticalPercent: 90,
                enableForecastedAlarm: false,
              },
              dashboardEnabled: false,
            };

            // Remove selected optional fields
            for (const field of fieldsToOmit) {
              if (field === 'creditPercentage') delete config.billing.creditPercentage;
              if (field === 'ratePerAgentSecond') delete config.billing.ratePerAgentSecond;
              if (field === 'warningPercent') delete config.alerts.warningPercent;
              if (field === 'criticalPercent') delete config.alerts.criticalPercent;
              if (field === 'enableForecastedAlarm') delete config.alerts.enableForecastedAlarm;
              if (field === 'dashboardEnabled') delete config.dashboardEnabled;
            }

            const result = validateConfig(config);

            // Verify defaults are applied for omitted fields
            if (fieldsToOmit.includes('creditPercentage')) {
              expect(result.billing.creditPercentage).toBe(75);
            }
            if (fieldsToOmit.includes('ratePerAgentSecond')) {
              expect(result.billing.ratePerAgentSecond).toBe(0.0083);
            }
            if (fieldsToOmit.includes('warningPercent')) {
              expect(result.alerts.warningPercent).toBe(75);
            }
            if (fieldsToOmit.includes('criticalPercent')) {
              expect(result.alerts.criticalPercent).toBe(100);
            }
            if (fieldsToOmit.includes('enableForecastedAlarm')) {
              expect(result.alerts.enableForecastedAlarm).toBe(true);
            }
            if (fieldsToOmit.includes('dashboardEnabled')) {
              expect(result.dashboardEnabled).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Missing required fields are rejected
   * **Validates: Requirements 10.1, 10.3, 10.4**
   */
  describe('Property 4: Missing required fields are rejected', () => {
    const requiredFieldRemovals: Array<{
      name: string;
      remove: (config: any) => void;
      expectedError: RegExp;
    }> = [
      {
        name: 'monitoringAccount.accountId',
        remove: (config) => { delete config.monitoringAccount.accountId; },
        expectedError: /monitoringAccount\.accountId/,
      },
      {
        name: 'monitoringAccount.region',
        remove: (config) => { delete config.monitoringAccount.region; },
        expectedError: /monitoringAccount\.region/,
      },
      {
        name: 'sourceAccounts[0].accountId',
        remove: (config) => { delete config.sourceAccounts[0].accountId; },
        expectedError: /sourceAccounts\[0\]\.accountId/,
      },
      {
        name: 'sourceAccounts[0].region',
        remove: (config) => { delete config.sourceAccounts[0].region; },
        expectedError: /sourceAccounts\[0\]\.region/,
      },
      {
        name: 'alerts.email',
        remove: (config) => { delete config.alerts.email; },
        expectedError: /alerts\.email/,
      },
      {
        name: 'billing.enterpriseSupportMonthlyFee',
        remove: (config) => { delete config.billing.enterpriseSupportMonthlyFee; },
        expectedError: /billing\.enterpriseSupportMonthlyFee/,
      },
    ];

    it('rejects configs with one required field removed at a time', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...requiredFieldRemovals),
          (fieldRemoval) => {
            const config = validBaseConfig();
            fieldRemoval.remove(config);
            expect(() => validateConfig(config)).toThrow(fieldRemoval.expectedError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Invalid accountId format is rejected
   * **Validates: Requirements 10.7**
   */
  describe('Property 5: Invalid accountId format is rejected', () => {
    it('rejects accountIds that are not exactly 12 numeric digits', () => {
      const invalidAccountIdArb = fc.oneof(
        // Too short (1-11 digits)
        fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'), { minLength: 1, maxLength: 11 }),
        // Too long (13+ digits)
        fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'), { minLength: 13, maxLength: 20 }),
        // Contains non-numeric characters (12 chars but not all digits)
        fc.string({ minLength: 12, maxLength: 12 }).filter(s => !/^\d{12}$/.test(s)),
        // Empty string
        fc.constant(''),
        // Mixed alphanumeric of length 12
        fc.stringOf(fc.constantFrom('a','b','c','1','2','3','x','y','z','0'), { minLength: 12, maxLength: 12 })
          .filter(s => !/^\d{12}$/.test(s))
      );

      fc.assert(
        fc.property(invalidAccountIdArb, (invalidId) => {
          const config = validBaseConfig();
          config.monitoringAccount.accountId = invalidId;
          expect(() => validateConfig(config)).toThrow(/accountId/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Duplicate source accounts are detected
   * **Validates: Requirements 9.5**
   */
  describe('Property 8: Duplicate source accounts are detected', () => {
    it('rejects configs with duplicate source account entries', () => {
      fc.assert(
        fc.property(
          fc.record({
            accountId: fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'), { minLength: 12, maxLength: 12 }),
            region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
          }),
          fc.array(
            fc.record({
              accountId: fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'), { minLength: 12, maxLength: 12 }),
              region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          (duplicateEntry, otherEntries) => {
            const config = validBaseConfig();
            // Create array with the duplicate entry appearing at least twice
            config.sourceAccounts = [
              duplicateEntry,
              ...otherEntries,
              duplicateEntry, // intentional duplicate
            ];
            expect(() => validateConfig(config)).toThrow(/[Dd]uplicate source account/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
