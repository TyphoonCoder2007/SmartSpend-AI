import { Transaction } from '../types';

const STORAGE_KEY = 'smartspend_transactions';
const THEME_KEY = 'smartspend_theme';
const CURRENCY_KEY = 'smartspend_currency';
const INITIAL_BALANCE_KEY = 'smartspend_initial_balance';

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions', error);
  }
};

export const loadTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load transactions', error);
    return [];
  }
};

export const saveTheme = (isDark: boolean): void => {
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
};

export const loadTheme = (): boolean => {
  return localStorage.getItem(THEME_KEY) === 'dark';
};

export const saveCurrency = (currency: string): void => {
  localStorage.setItem(CURRENCY_KEY, currency);
};

export const loadCurrency = (): string => {
  return localStorage.getItem(CURRENCY_KEY) || '$';
};

export const saveInitialBalance = (amount: number): void => {
  localStorage.setItem(INITIAL_BALANCE_KEY, amount.toString());
};

export const loadInitialBalance = (): number => {
  const amount = localStorage.getItem(INITIAL_BALANCE_KEY);
  return amount ? parseFloat(amount) : 0;
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(CURRENCY_KEY);
  localStorage.removeItem(INITIAL_BALANCE_KEY);
};