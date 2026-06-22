import { validateConfig } from '../../lib/config-validator';

/** Helper: returns a minimal valid config object */
function validConfig() {
  return {
    monitoringAccount: {
      accountId: '123456789012',
      region: 'us-east-1',
    },
    sourceAccounts: [
      { accountId: '111222333444', region: 'us-west-2' },
    ],
    billing: {
      enterpriseSupportMonthlyFee: 15000,
    },
    alerts: {
      email: 'ops@example.com',
    },
  };
}

describe('validateConfig', () => {
  describe('valid config acceptance', () => {
    it('returns AppConfig with all fields populated from a valid config', () => {
      const result = validateConfig(validConfig());

      expect(result.monitoringAccount).toEqual({
        accountId: '123456789012',
        region: 'us-east-1',
      });
      expect(result.sourceAccounts).toEqual([
        { accountId: '111222333444', region: 'us-west-2' },
      ]);
      expect(result.billing.enterpriseSupportMonthlyFee).toBe(15000);
      expect(result.alerts.email).toBe('ops@example.com');
      expect(result.dashboardEnabled).toBe(true);
    });

    it('accepts config with all optional fields explicitly set', () => {
      const cfg = {
        ...validConfig(),
        orgId: 'o-abc123',
        dashboardEnabled: false,
        billing: {
          enterpriseSupportMonthlyFee: 10000,
          creditPercentage: 50,
          ratePerAgentSecond: 0.01,
        },
        alerts: {
          email: 'team@example.com',
          warningPercent: 60,
          criticalPercent: 90,
          enableForecastedAlarm: false,
        },
      };

      const result = validateConfig(cfg);

      expect(result.orgId).toBe('o-abc123');
      expect(result.dashboardEnabled).toBe(false);
      expect(result.billing.creditPercentage).toBe(50);
      expect(result.billing.ratePerAgentSecond).toBe(0.01);
      expect(result.alerts.warningPercent).toBe(60);
      expect(result.alerts.criticalPercent).toBe(90);
      expect(result.alerts.enableForecastedAlarm).toBe(false);
    });
  });

  describe('missing required fields produce correct error messages', () => {
    it('throws for missing monitoringAccount.accountId', () => {
      const cfg = validConfig();
      delete (cfg.monitoringAccount as any).accountId;

      expect(() => validateConfig(cfg)).toThrow(
        'Missing required field: monitoringAccount.accountId'
      );
    });

    it('throws for missing monitoringAccount.region', () => {
      const cfg = validConfig();
      delete (cfg.monitoringAccount as any).region;

      expect(() => validateConfig(cfg)).toThrow(
        'Missing required field: monitoringAccount.region'
      );
    });

    it('throws for empty sourceAccounts array', () => {
      const cfg = validConfig();
      cfg.sourceAccounts = [];

      expect(() => validateConfig(cfg)).toThrow(
        'sourceAccounts must contain at least one entry'
      );
    });

    it('throws for missing alerts.email', () => {
      const cfg = validConfig();
      delete (cfg.alerts as any).email;

      expect(() => validateConfig(cfg)).toThrow(
        'Missing required field: alerts.email'
      );
    });

    it('throws for missing billing.enterpriseSupportMonthlyFee', () => {
      const cfg = validConfig();
      delete (cfg.billing as any).enterpriseSupportMonthlyFee;

      expect(() => validateConfig(cfg)).toThrow(
        'Missing required field: billing.enterpriseSupportMonthlyFee'
      );
    });
  });

  describe('default value application for optional fields', () => {
    it('applies creditPercentage default of 75', () => {
      const result = validateConfig(validConfig());
      expect(result.billing.creditPercentage).toBe(75);
    });

    it('applies ratePerAgentSecond default of 0.0083', () => {
      const result = validateConfig(validConfig());
      expect(result.billing.ratePerAgentSecond).toBe(0.0083);
    });

    it('applies warningPercent default of 75', () => {
      const result = validateConfig(validConfig());
      expect(result.alerts.warningPercent).toBe(75);
    });

    it('applies criticalPercent default of 100', () => {
      const result = validateConfig(validConfig());
      expect(result.alerts.criticalPercent).toBe(100);
    });

    it('applies enableForecastedAlarm default of true', () => {
      const result = validateConfig(validConfig());
      expect(result.alerts.enableForecastedAlarm).toBe(true);
    });

    it('applies dashboardEnabled default of true', () => {
      const result = validateConfig(validConfig());
      expect(result.dashboardEnabled).toBe(true);
    });
  });

  describe('duplicate source account detection', () => {
    it('throws when the same accountId+region appears twice', () => {
      const cfg = validConfig();
      cfg.sourceAccounts = [
        { accountId: '111222333444', region: 'us-west-2' },
        { accountId: '111222333444', region: 'us-west-2' },
      ];

      expect(() => validateConfig(cfg)).toThrow(
        'Duplicate source account: 111222333444 in us-west-2'
      );
    });

    it('allows same accountId in different regions', () => {
      const cfg = validConfig();
      cfg.sourceAccounts = [
        { accountId: '111222333444', region: 'us-west-2' },
        { accountId: '111222333444', region: 'us-east-1' },
      ];

      expect(() => validateConfig(cfg)).not.toThrow();
    });
  });

  describe('accountId format validation', () => {
    it('throws for non-numeric accountId', () => {
      const cfg = validConfig();
      cfg.monitoringAccount.accountId = 'abcdefghijkl';

      expect(() => validateConfig(cfg)).toThrow(
        "Invalid accountId 'abcdefghijkl': must be exactly 12 digits"
      );
    });

    it('throws for accountId that is too short', () => {
      const cfg = validConfig();
      cfg.monitoringAccount.accountId = '12345';

      expect(() => validateConfig(cfg)).toThrow(
        "Invalid accountId '12345': must be exactly 12 digits"
      );
    });

    it('throws for accountId that is too long', () => {
      const cfg = validConfig();
      cfg.monitoringAccount.accountId = '1234567890123';

      expect(() => validateConfig(cfg)).toThrow(
        "Invalid accountId '1234567890123': must be exactly 12 digits"
      );
    });

    it('throws for accountId with mixed alphanumeric characters', () => {
      const cfg = validConfig();
      cfg.monitoringAccount.accountId = '12345abc9012';

      expect(() => validateConfig(cfg)).toThrow(
        "Invalid accountId '12345abc9012': must be exactly 12 digits"
      );
    });
  });

  describe('numeric range validation', () => {
    it('throws when creditPercentage is below 1', () => {
      const cfg = validConfig();
      (cfg.billing as any).creditPercentage = 0;

      expect(() => validateConfig(cfg)).toThrow(
        'creditPercentage must be between 1 and 100, got: 0'
      );
    });

    it('throws when creditPercentage is above 100', () => {
      const cfg = validConfig();
      (cfg.billing as any).creditPercentage = 101;

      expect(() => validateConfig(cfg)).toThrow(
        'creditPercentage must be between 1 and 100, got: 101'
      );
    });

    it('throws when warningPercent is below 1', () => {
      const cfg = validConfig();
      (cfg.alerts as any).warningPercent = 0;

      expect(() => validateConfig(cfg)).toThrow(
        'warningPercent must be between 1 and 99, got: 0'
      );
    });

    it('throws when warningPercent is above 99', () => {
      const cfg = validConfig();
      (cfg.alerts as any).warningPercent = 100;

      expect(() => validateConfig(cfg)).toThrow(
        'warningPercent must be between 1 and 99, got: 100'
      );
    });

    it('throws when criticalPercent is less than warningPercent', () => {
      const cfg = validConfig();
      (cfg.alerts as any).warningPercent = 80;
      (cfg.alerts as any).criticalPercent = 50;

      expect(() => validateConfig(cfg)).toThrow(
        'criticalPercent (50) must be >= warningPercent (80)'
      );
    });
  });
});
