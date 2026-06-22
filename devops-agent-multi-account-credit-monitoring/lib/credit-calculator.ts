import { BillingConfig, AlertsConfig, CreditThresholds } from './types';

/**
 * Validates billing and alerts numeric inputs, then computes credit thresholds.
 *
 * @param billing - Billing configuration with fee, credit percentage, and rate
 * @param alerts - Alerts configuration with warning and critical percentages
 * @returns Computed credit thresholds
 * @throws Error if any numeric input violates its constraint
 */
export function calculateThresholds(billing: BillingConfig, alerts: AlertsConfig): CreditThresholds {
  const {
    enterpriseSupportMonthlyFee,
    creditPercentage = 75,
    ratePerAgentSecond = 0.0083,
  } = billing;

  const {
    warningPercent = 75,
    criticalPercent = 100,
  } = alerts;

  // Validate inputs
  if (enterpriseSupportMonthlyFee <= 0) {
    throw new Error(`enterpriseSupportMonthlyFee must be positive, got: ${enterpriseSupportMonthlyFee}`);
  }

  if (creditPercentage < 1 || creditPercentage > 100) {
    throw new Error(`creditPercentage must be between 1 and 100, got: ${creditPercentage}`);
  }

  if (ratePerAgentSecond <= 0) {
    throw new Error(`ratePerAgentSecond must be positive, got: ${ratePerAgentSecond}`);
  }

  if (warningPercent < 1 || warningPercent > 99) {
    throw new Error(`warningPercent must be between 1 and 99, got: ${warningPercent}`);
  }

  if (criticalPercent < 1 || criticalPercent > 100) {
    throw new Error(`criticalPercent must be between 1 and 100, got: ${criticalPercent}`);
  }

  // Compute thresholds
  const monthlyCredit = enterpriseSupportMonthlyFee * creditPercentage / 100;
  const totalAgentSeconds = Math.floor(monthlyCredit / ratePerAgentSecond);
  const warningThreshold = Math.floor(totalAgentSeconds * warningPercent / 100);
  const criticalThreshold = Math.floor(totalAgentSeconds * criticalPercent / 100);

  return {
    monthlyCredit,
    totalAgentSeconds,
    warningThreshold,
    criticalThreshold,
  };
}
