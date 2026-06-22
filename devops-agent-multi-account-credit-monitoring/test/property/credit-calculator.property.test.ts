import * as fc from 'fast-check';
import { calculateThresholds } from '../../lib/credit-calculator';

describe('credit-calculator property tests', () => {
  /**
   * Property 1: Credit calculation correctness
   *
   * For any valid billing configuration and valid alerts configuration,
   * calculateThresholds SHALL produce values matching the mathematical formulas exactly.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  it('Property 1: Credit calculation correctness', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),       // fee
        fc.integer({ min: 1, max: 100 }),                             // creditPercentage
        fc.double({ min: 0.0001, max: 1.0, noNaN: true }),           // ratePerAgentSecond
        fc.integer({ min: 1, max: 99 }),                              // warningPercent
        fc.integer({ min: 1, max: 100 }),                             // criticalPercent (before clamping)
        (fee, creditPercentage, ratePerAgentSecond, warningPercent, criticalPercentRaw) => {
          // Ensure criticalPercent >= warningPercent
          const criticalPercent = Math.max(criticalPercentRaw, warningPercent);

          const billing = {
            enterpriseSupportMonthlyFee: fee,
            creditPercentage,
            ratePerAgentSecond,
          };
          const alerts = {
            email: 'test@example.com',
            warningPercent,
            criticalPercent,
          };

          const result = calculateThresholds(billing, alerts);

          const expectedMonthlyCredit = fee * creditPercentage / 100;
          const expectedTotalAgentSeconds = Math.floor(expectedMonthlyCredit / ratePerAgentSecond);
          const expectedWarningThreshold = Math.floor(expectedTotalAgentSeconds * warningPercent / 100);
          const expectedCriticalThreshold = Math.floor(expectedTotalAgentSeconds * criticalPercent / 100);

          expect(result.monthlyCredit).toBe(expectedMonthlyCredit);
          expect(result.totalAgentSeconds).toBe(expectedTotalAgentSeconds);
          expect(result.warningThreshold).toBe(expectedWarningThreshold);
          expect(result.criticalThreshold).toBe(expectedCriticalThreshold);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Threshold ordering invariant
   *
   * For any valid configuration, the computed thresholds SHALL satisfy:
   * warningThreshold <= criticalThreshold <= totalAgentSeconds
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('Property 10: Threshold ordering invariant', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),       // fee
        fc.integer({ min: 1, max: 100 }),                             // creditPercentage
        fc.double({ min: 0.0001, max: 1.0, noNaN: true }),           // ratePerAgentSecond
        fc.integer({ min: 1, max: 99 }),                              // warningPercent
        fc.integer({ min: 1, max: 100 }),                             // criticalPercent (before clamping)
        (fee, creditPercentage, ratePerAgentSecond, warningPercent, criticalPercentRaw) => {
          // Ensure criticalPercent >= warningPercent
          const criticalPercent = Math.max(criticalPercentRaw, warningPercent);

          const billing = {
            enterpriseSupportMonthlyFee: fee,
            creditPercentage,
            ratePerAgentSecond,
          };
          const alerts = {
            email: 'test@example.com',
            warningPercent,
            criticalPercent,
          };

          const result = calculateThresholds(billing, alerts);

          expect(result.warningThreshold).toBeLessThanOrEqual(result.criticalThreshold);
          expect(result.criticalThreshold).toBeLessThanOrEqual(result.totalAgentSeconds);
        }
      ),
      { numRuns: 100 }
    );
  });
});
