
export enum FinanceMode {
  INDIVIDUAL = 'Individual',
  BUSINESS = 'Business',
  FAMILY = 'Family',
  TRIP = 'Trip/Travel'
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
];

export interface Transaction {
  id: string;
  category: string;
  amount: number; // 64-bit float handles large financial values accurately up to trillions
  description: string;
  date: string;
}

export interface User {
  username: string;
  mode: FinanceMode;
  transactions: Transaction[];
  currency: Currency;
  isRegistered?: boolean;
}

export interface Anomaly {
  category: string;
  amount: number;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  summary: string;
  healthScore: number;
  anomalies: Anomaly[];
  categoryBreakdown: { name: string; value: number }[];
  trendAnalysis: { date: string; amount: number }[];
}

export const MODE_CONFIG: Record<FinanceMode, string[]> = {
  [FinanceMode.INDIVIDUAL]: ['Income/Salary', 'Food', 'Transport', 'Rent', 'Subscription', 'Entertainment', 'Investments'],
  [FinanceMode.BUSINESS]: ['Revenue/Sales', 'Operational Expenses', 'Salaries', 'Utilities', 'Vendor Payments', 'Tax Payments', 'Inventory'],
  [FinanceMode.TRIP]: ['Refunds/Credits', 'Mode of Transportation', 'Accommodations', 'Food', 'Local Transport', 'Activities', 'Shopping'],
  [FinanceMode.FAMILY]: ['Income/Allowances', 'Groceries', 'School/College Fees', 'Healthcare', 'Insurance', 'Utilities', 'Maintenance']
};
