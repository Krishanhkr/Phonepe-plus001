export type QuarterValue = 'all' | '1' | '2' | '3' | '4';
export type YearValue = 'all' | '2020' | '2021' | '2022' | '2023' | '2024' | '2025';

export interface DashboardFilters {
  year: YearValue;
  quarter: QuarterValue;
  state: string; // 'all' or exact state name
}

export interface OverviewMetrics {
  totalTransactions: number;
  totalAmountInr: number;
  totalAmountCr: number;
  avgTransactionValue: number;
  yoyGrowthPct: number | null;
  yoyAmountGrowthPct: number | null;
  registeredUsers: number;
  appOpens: number;
  comparisonNote: string;
  activePeriodLabel: string;
  peakQuarterLabel: string;
  peakQuarterSurgePct: number;
}

export interface TrendPoint {
  label: string;
  year: number;
  quarter: number;
  transactionCount: number;
  amountCr: number;
  qoqGrowthPct: number | null;
  isFestivePeak: boolean;
}

export interface CategoryBreakdown {
  transactionType: string;
  transactionCount: number;
  amountCr: number;
  sharePct: number;
  avgTicketSize: number;
}

export interface StatePerformanceRow {
  state: string;
  transactionCount: number;
  amountCr: number;
  avgTicketSize: number;
  registeredUsers: number;
  appOpens: number;
  yoyGrowthPct: number | null;
  topCategory: string;
}

export interface DistrictPerformanceRow {
  district: string;
  state: string;
  transactionCount: number;
  amountCr: number;
  avgTicketSize: number;
  registeredUsers: number;
  shareOfStatePct: number;
}

export interface StateComparisonItem {
  state: string;
  totalTransactions: number;
  amountCr: number;
  avgTicketSize: number;
  registeredUsers: number;
  yoyGrowthPct: number | null;
  categories: CategoryBreakdown[];
  trend: { label: string; amountCr: number; transactionCount: number }[];
}

export interface FilterOptionsResponse {
  years: number[];
  quarters: number[];
  states: string[];
  categories: string[];
}

export interface IngestResponse {
  success: boolean;
  recordsProcessed: number;
  targetTable: 'transactions' | 'district_transactions';
  message: string;
}
