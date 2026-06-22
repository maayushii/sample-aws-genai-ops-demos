import { AccountConfig, AlertsConfig, AppConfig, BillingConfig } from './types';

/**
 * Validates raw configuration input and returns a fully-typed AppConfig
 * with defaults applied for optional fields.
 *
 * @throws Error with descriptive message identifying the specific field and constraint violated
 */
export function validateConfig(raw: unknown): AppConfig {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    throw new Error('Missing required field: monitoringAccount');
  }

  const config = raw as Record<string, unknown>;

  // Validate monitoringAccount
  const monitoringAccount = validateMonitoringAccount(config['monitoringAccount']);

  // Validate sourceAccounts
  const sourceAccounts = validateSourceAccounts(config['sourceAccounts']);

  // Validate billing
  const billing = validateBilling(config['billing']);

  // Validate alerts
  const alerts = validateAlerts(config['alerts']);

  // Validate criticalPercent >= warningPercent
  const warningPercent = alerts.warningPercent!;
  const criticalPercent = alerts.criticalPercent!;
  if (criticalPercent < warningPercent) {
    throw new Error(
      `criticalPercent (${criticalPercent}) must be >= warningPercent (${warningPercent})`
    );
  }

  // Optional fields
  const orgId = config['orgId'] !== undefined ? String(config['orgId']) : undefined;
  const dashboardEnabled = config['dashboardEnabled'] !== undefined
    ? Boolean(config['dashboardEnabled'])
    : true;

  return {
    monitoringAccount,
    sourceAccounts,
    billing,
    alerts,
    orgId,
    dashboardEnabled,
  };
}

function validateMonitoringAccount(value: unknown): AccountConfig {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new Error('Missing required field: monitoringAccount');
  }

  const obj = value as Record<string, unknown>;

  if (!obj['accountId'] && obj['accountId'] !== '') {
    throw new Error('Missing required field: monitoringAccount.accountId');
  }
  if (!obj['region'] && obj['region'] !== '') {
    throw new Error('Missing required field: monitoringAccount.region');
  }

  const accountId = String(obj['accountId']);
  const region = String(obj['region']);

  if (!accountId) {
    throw new Error('Missing required field: monitoringAccount.accountId');
  }
  if (!region) {
    throw new Error('Missing required field: monitoringAccount.region');
  }

  validateAccountId(accountId);

  return { accountId, region };
}

function validateSourceAccounts(value: unknown): AccountConfig[] {
  if (value === null || value === undefined) {
    throw new Error('Missing required field: sourceAccounts');
  }

  if (!Array.isArray(value)) {
    throw new Error('sourceAccounts must contain at least one entry');
  }

  if (value.length === 0) {
    throw new Error('sourceAccounts must contain at least one entry');
  }

  const accounts: AccountConfig[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (entry === null || entry === undefined || typeof entry !== 'object') {
      throw new Error(`Missing required field: sourceAccounts[${i}].accountId`);
    }

    const obj = entry as Record<string, unknown>;

    if (!obj['accountId'] && obj['accountId'] !== '') {
      throw new Error(`Missing required field: sourceAccounts[${i}].accountId`);
    }
    if (!obj['region'] && obj['region'] !== '') {
      throw new Error(`Missing required field: sourceAccounts[${i}].region`);
    }

    const accountId = String(obj['accountId']);
    const region = String(obj['region']);

    if (!accountId) {
      throw new Error(`Missing required field: sourceAccounts[${i}].accountId`);
    }
    if (!region) {
      throw new Error(`Missing required field: sourceAccounts[${i}].region`);
    }

    validateAccountId(accountId);
    accounts.push({ accountId, region });
  }

  // Detect duplicates
  const seen = new Set<string>();
  for (const account of accounts) {
    const key = `${account.accountId}:${account.region}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate source account: ${account.accountId} in ${account.region}`);
    }
    seen.add(key);
  }

  return accounts;
}

function validateBilling(value: unknown): BillingConfig {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new Error('Missing required field: billing.enterpriseSupportMonthlyFee');
  }

  const obj = value as Record<string, unknown>;

  if (obj['enterpriseSupportMonthlyFee'] === undefined || obj['enterpriseSupportMonthlyFee'] === null) {
    throw new Error('Missing required field: billing.enterpriseSupportMonthlyFee');
  }

  const fee = Number(obj['enterpriseSupportMonthlyFee']);
  if (isNaN(fee) || fee <= 0) {
    throw new Error(`enterpriseSupportMonthlyFee must be positive, got: ${obj['enterpriseSupportMonthlyFee']}`);
  }

  // creditPercentage: default 75, range [1, 100]
  let creditPercentage = 75;
  if (obj['creditPercentage'] !== undefined && obj['creditPercentage'] !== null) {
    creditPercentage = Number(obj['creditPercentage']);
    if (isNaN(creditPercentage) || creditPercentage < 1 || creditPercentage > 100) {
      throw new Error(`creditPercentage must be between 1 and 100, got: ${obj['creditPercentage']}`);
    }
  }

  // ratePerAgentSecond: default 0.0083, must be positive
  let ratePerAgentSecond = 0.0083;
  if (obj['ratePerAgentSecond'] !== undefined && obj['ratePerAgentSecond'] !== null) {
    ratePerAgentSecond = Number(obj['ratePerAgentSecond']);
    if (isNaN(ratePerAgentSecond) || ratePerAgentSecond <= 0) {
      throw new Error(`ratePerAgentSecond must be positive, got: ${obj['ratePerAgentSecond']}`);
    }
  }

  return {
    enterpriseSupportMonthlyFee: fee,
    creditPercentage,
    ratePerAgentSecond,
  };
}

function validateAlerts(value: unknown): AlertsConfig {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new Error('Missing required field: alerts.email');
  }

  const obj = value as Record<string, unknown>;

  if (obj['email'] === undefined || obj['email'] === null || String(obj['email']).trim() === '') {
    throw new Error('Missing required field: alerts.email');
  }

  const email = String(obj['email']);

  // warningPercent: default 75, range [1, 99]
  let warningPercent = 75;
  if (obj['warningPercent'] !== undefined && obj['warningPercent'] !== null) {
    warningPercent = Number(obj['warningPercent']);
    if (isNaN(warningPercent) || warningPercent < 1 || warningPercent > 99) {
      throw new Error(`warningPercent must be between 1 and 99, got: ${obj['warningPercent']}`);
    }
  }

  // criticalPercent: default 100, range [1, 100]
  let criticalPercent = 100;
  if (obj['criticalPercent'] !== undefined && obj['criticalPercent'] !== null) {
    criticalPercent = Number(obj['criticalPercent']);
    if (isNaN(criticalPercent) || criticalPercent < 1 || criticalPercent > 100) {
      throw new Error(`criticalPercent must be between 1 and 100, got: ${obj['criticalPercent']}`);
    }
  }

  // enableForecastedAlarm: default true
  let enableForecastedAlarm = true;
  if (obj['enableForecastedAlarm'] !== undefined && obj['enableForecastedAlarm'] !== null) {
    enableForecastedAlarm = Boolean(obj['enableForecastedAlarm']);
  }

  return {
    email,
    warningPercent,
    criticalPercent,
    enableForecastedAlarm,
  };
}

function validateAccountId(accountId: string): void {
  if (!/^\d{12}$/.test(accountId)) {
    throw new Error(`Invalid accountId '${accountId}': must be exactly 12 digits`);
  }
}
