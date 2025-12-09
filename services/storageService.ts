import { Transaction } from '../types';

const STORAGE_KEY = 'smartspend_transactions';
const THEME_KEY = 'smartspend_theme';
const CURRENCY_KEY = 'smartspend_currency';

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