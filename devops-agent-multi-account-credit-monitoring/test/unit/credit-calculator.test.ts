import { calculateThresholds } from '../../lib/credit-calculator';
import { BillingConfig, AlertsConfig } from '../../lib/types';

describe('calculateThresholds', () => {
  const validBilling: BillingConfig = {
    enterpriseSupportMonthlyFee: 15000,
    creditPercentage: 75,
    ratePerAgentSecond: 0.0083,
  };

  const validAlerts: AlertsConfig = {
    email: 'test@example.com',
    warningPercent: 75,
    criticalPercent: 100,
  };

  describe('known input/output pairs', () => {
    it('computes thresholds for fee=15000, creditPct=75, rate=0.0083, warnPct=75, critPct=100', () => {
      const result = calculateThresholds(validBilling, validAlerts);

      // monthlyCredit = 15000 * 75 / 100 = 11250
      expect(result.monthlyCredit).toBe(11250);
      // totalAgentSeconds = floor(11250 / 0.0083) = floor(1355421.686...) = 1355421
      expect(result.totalAgentSeconds).toBe(1355421);
      // warningThreshold = floor(1355421 * 75 / 100) = floor(1016565.75) = 1016565
      expect(result.warningThreshold).toBe(1016565);
      // criticalThreshold = floor(1355421 * 100 / 100) = 1355421
      expect(result.criticalThreshold).toBe(1355421);
    });

    it('computes thresholds for fee=1000, creditPct=50, rate=0.01, warnPct=50, critPct=90', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 1000,
        creditPercentage: 50,
        ratePerAgentSecond: 0.01,
      };
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 50,
        criticalPercent: 90,
      };

      const result = calculateThresholds(billing, alerts);

      // monthlyCredit = 1000 * 50 / 100 = 500
      expect(result.monthlyCredit).toBe(500);
      // totalAgentSeconds = floor(500 / 0.01) = 50000
      expect(result.totalAgentSeconds).toBe(50000);
      // warningThreshold = floor(50000 * 50 / 100) = 25000
      expect(result.warningThreshold).toBe(25000);
      // criticalThreshold = floor(50000 * 90 / 100) = 45000
      expect(result.criticalThreshold).toBe(45000);
    });
  });

  describe('boundary values', () => {
    it('handles minimum valid percentages (creditPct=1, warnPct=1, critPct=1)', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 15000,
        creditPercentage: 1,
        ratePerAgentSecond: 0.0083,
      };
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 1,
        criticalPercent: 1,
      };

      const result = calculateThresholds(billing, alerts);

      // monthlyCredit = 15000 * 1 / 100 = 150
      expect(result.monthlyCredit).toBe(150);
      // totalAgentSeconds = floor(150 / 0.0083) = floor(18072.289...) = 18072
      expect(result.totalAgentSeconds).toBe(18072);
      // warningThreshold = floor(18072 * 1 / 100) = floor(180.72) = 180
      expect(result.warningThreshold).toBe(180);
      // criticalThreshold = floor(18072 * 1 / 100) = floor(180.72) = 180
      expect(result.criticalThreshold).toBe(180);
    });

    it('handles very large fee (1000000)', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 1000000,
        creditPercentage: 75,
        ratePerAgentSecond: 0.0083,
      };

      const result = calculateThresholds(billing, validAlerts);

      // monthlyCredit = 1000000 * 75 / 100 = 750000
      expect(result.monthlyCredit).toBe(750000);
      // totalAgentSeconds = floor(750000 / 0.0083) = floor(90361445.78...) = 90361445
      expect(result.totalAgentSeconds).toBe(90361445);
      // warningThreshold = floor(90361445 * 75 / 100) = floor(67771083.75) = 67771083
      expect(result.warningThreshold).toBe(67771083);
      // criticalThreshold = floor(90361445 * 100 / 100) = 90361445
      expect(result.criticalThreshold).toBe(90361445);
    });
  });

  describe('error cases', () => {
    it('throws for fee=0 with message containing "enterpriseSupportMonthlyFee" and "positive"', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 0,
        creditPercentage: 75,
        ratePerAgentSecond: 0.0083,
      };

      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/enterpriseSupportMonthlyFee/);
      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/positive/);
    });

    it('throws for fee=-100 with message containing "enterpriseSupportMonthlyFee" and "positive"', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: -100,
        creditPercentage: 75,
        ratePerAgentSecond: 0.0083,
      };

      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/enterpriseSupportMonthlyFee/);
      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/positive/);
    });

    it('throws for creditPercentage=0 with message containing "creditPercentage" and "between 1 and 100"', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 15000,
        creditPercentage: 0,
        ratePerAgentSecond: 0.0083,
      };

      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/creditPercentage/);
      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/between 1 and 100/);
    });

    it('throws for creditPercentage=101 with message containing "creditPercentage" and "between 1 and 100"', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 15000,
        creditPercentage: 101,
        ratePerAgentSecond: 0.0083,
      };

      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/creditPercentage/);
      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/between 1 and 100/);
    });

    it('throws for ratePerAgentSecond=0 with message containing "ratePerAgentSecond" and "positive"', () => {
      const billing: BillingConfig = {
        enterpriseSupportMonthlyFee: 15000,
        creditPercentage: 75,
        ratePerAgentSecond: 0,
      };

      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/ratePerAgentSecond/);
      expect(() => calculateThresholds(billing, validAlerts)).toThrow(/positive/);
    });

    it('throws for warningPercent=0 with message containing "warningPercent" and "between 1 and 99"', () => {
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 0,
        criticalPercent: 100,
      };

      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/warningPercent/);
      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/between 1 and 99/);
    });

    it('throws for warningPercent=100 with message containing "warningPercent" and "between 1 and 99"', () => {
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 100,
        criticalPercent: 100,
      };

      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/warningPercent/);
      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/between 1 and 99/);
    });

    it('throws for criticalPercent=0 with message containing "criticalPercent" and "between 1 and 100"', () => {
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 50,
        criticalPercent: 0,
      };

      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/criticalPercent/);
      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/between 1 and 100/);
    });

    it('throws for criticalPercent=101 with message containing "criticalPercent" and "between 1 and 100"', () => {
      const alerts: AlertsConfig = {
        email: 'test@example.com',
        warningPercent: 50,
        criticalPercent: 101,
      };

      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/criticalPercent/);
      expect(() => calculateThresholds(validBilling, alerts)).toThrow(/between 1 and 100/);
    });
  });
});
