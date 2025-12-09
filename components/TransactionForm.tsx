import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Icon } from './Icon';
import { parseReceiptImage, categorizeDescription } from '../services/geminiService';

interface TransactionFormProps {
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  initialData?: Transaction;
  currency: string;
}

const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Shopping', 'Housing', 'Utilities', 
  'Entertainment', 'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Other'
];

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel, initialData, currency }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || 'Food');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  
  const [isScanning, setIsScanning] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onSubmit({
      amount: parseFloat(amount),
      category,
      date,
      description,
      type
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await parseReceiptImage(base64);
        
        if (data.amount) setAmount(data.amount.toString());
        if (data.date) setDate(data.date);
        if (data.merchant) setDescription(data.merchant);
        if (data.category) setCategory(data.category);
        setType('expense'); // Receipts are usually expenses
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Failed to analyze receipt. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSmartCategorize = async () => {
    if (!description) return;
    setIsCategorizing(true);
    try {
      const cat = await categorizeDescription(description);
      if (cat && CATEGORIES.includes(cat)) {
        setCategory(cat);
      }
    } catch (err) {
      // ignore
    } finally {
      setIsCategorizing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === t 
                ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{currency}</span>
          </div>
          <input
            type="number"
            required
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full pl-7 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:text-white text-lg"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
          >
            {isScanning ? <Icon name="Loader2" className="animate-spin w-3 h-3" /> : <Icon name="ScanLine" className="w-3 h-3" />}
            Scan Receipt
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
        <div className="relative">
            <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSmartCategorize}
            className="block w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:text-white"
            placeholder="e.g. Starbucks Coffee"
            />
            {isCategorizing && (
               <div className="absolute right-3 top-3.5">
                    <Icon name="Loader2" className="animate-spin w-4 h-4 text-gray-400" />
               </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="block w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:text-white"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30"
        >
          Save Transaction
        </button>
      </div>
    </form>
  );
};