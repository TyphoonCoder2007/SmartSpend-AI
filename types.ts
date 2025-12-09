export type TransactionType = 'expense' | 'income';

export type Category = 
  | 'Food' 
  | 'Transport' 
  | 'Housing' 
  | 'Utilities' 
  | 'Shopping' 
  | 'Entertainment' 
  | 'Health' 
  | 'Education' 
  | 'Salary' 
  | 'Freelance' 
  | 'Investment' 
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO date string
  description: string;
  type: TransactionType;
}

export interface SpendingInsight {
  title: string;
  message: string;
  type: 'warning' | 'positive' | 'neutral';
}

export interface ReceiptData {
  amount?: number;
  date?: string;
  merchant?: string;
  category?: Category;
}
