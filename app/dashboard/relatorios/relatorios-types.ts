export type ReportArea =
  "ALL" | "COMMERCIAL" | "OPERATIONAL" | "FINANCIAL" | "INVENTORY" | "ASSETS" | "PRICING";
export type ReportPeriodPreset =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "CURRENT_MONTH"
  | "PREVIOUS_MONTH"
  | "CURRENT_QUARTER"
  | "CURRENT_YEAR"
  | "CUSTOM";
export type ReportComparison = "NONE" | "PREVIOUS_PERIOD" | "CUSTOM";
export type DateRange = { start: string; end: string };
export type ReportFilter = {
  preset: ReportPeriodPreset;
  startDate: string;
  endDate: string;
  comparison: ReportComparison;
  comparisonStartDate: string;
  comparisonEndDate: string;
  area: ReportArea;
  clientId: string;
  salesOwner: string;
  technician: string;
  category: string;
  status: string;
  origin: string;
  city: string;
  state: string;
  serviceType: string;
  financialAccount: string;
  financialNature: string;
  assetOwnership: string;
  divergence: string;
  includeArchived: boolean;
};
export type ReportSource =
  | "CRM"
  | "CLIENTS"
  | "ORDERS"
  | "AGENDA"
  | "FINANCIAL"
  | "STOCK"
  | "EQUIPMENT"
  | "PRICING";
export type ReportSourceStatus = {
  source: ReportSource;
  available: boolean;
  partial: boolean;
  recordCount: number;
  updatedAt?: string;
  executionTimeMs: number;
  error?: string;
  warnings: string[];
};
export type ReportTrend =
  "UP" | "DOWN" | "STABLE" | "NOT_COMPARABLE" | "INSUFFICIENT_DATA";
export type MetricStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
export type ReportMetric = {
  id: string;
  title: string;
  value?: number;
  formattedValue: string;
  previousValue?: number;
  absoluteChange?: number;
  percentageChange?: number;
  trend: ReportTrend;
  inverse?: boolean;
  source: ReportSource[];
  updatedAt?: string;
  status: MetricStatus;
  description: string;
  link?: string;
};
export type ChartSeries = { name: string; values: number[]; color?: string };
export type ChartDataset = {
  id: string;
  title: string;
  labels: string[];
  series: ChartSeries[];
  unit: "number" | "currency" | "percentage" | "hours";
  currency?: string;
  percentage?: boolean;
  stacked?: boolean;
  source: ReportSource[];
  empty: boolean;
  partial: boolean;
};
export type RankingItem = {
  id: string;
  label: string;
  description?: string;
  value: number;
  formattedValue: string;
  link?: string;
};
export type ReportSection = {
  area: Exclude<ReportArea, "ALL">;
  title: string;
  description: string;
  metrics: ReportMetric[];
  charts: ChartDataset[];
  rankings: { id: string; title: string; items: RankingItem[] }[];
};
export type ReportDataset = {
  generatedAt: string;
  executionTimeMs: number;
  period: DateRange;
  comparisonPeriod?: DateRange;
  filters: ReportFilter;
  sourceStatus: ReportSourceStatus[];
  sections: ReportSection[];
};
export type GatewayResult<T> = { data?: T; status: ReportSourceStatus };
