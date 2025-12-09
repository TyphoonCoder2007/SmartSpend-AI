import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, SpendingInsight, Category, TransactionType } from './types';
import { 
  saveTransactions, loadTransactions, 
  saveTheme, loadTheme, 
  saveCurrency, loadCurrency,
  saveInitialBalance, loadInitialBalance,
  clearAllData
} from './services/storageService';
import { getSpendingInsights } from './services/geminiService';
import { Icon } from './components/Icon';
import { Card } from './components/Card';
import { TransactionForm } from './components/TransactionForm';
import { ExpensePieChart, WeeklyBarChart } from './components/Charts';
import { AppIcon } from './components/AppIcon';
import { ChatBot } from './components/ChatBot';

// --- Sub-components for Cleaner App File ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Icon name="X" className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
    label: string; 
    amount: number; 
    type?: 'income' | 'expense' | 'neutral'; 
    icon: any; 
    currency: string;
    onEdit?: () => void; 
}> = ({ label, amount, type = 'neutral', icon, currency, onEdit }) => {
    const colorClass = type === 'income' ? 'text-emerald-500' : type === 'expense' ? 'text-rose-500' : 'text-primary-500';
    const locale = currency === '₹' ? 'en-IN' : 'en-US';
    
    return (
        <Card className="flex-1 min-w-[140px] relative group">
            {onEdit && (
                <button 
                    onClick={onEdit} 
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Edit Balance"
                >
                    <Icon name="Pencil" className="w-3.5 h-3.5" />
                </button>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
                    <h3 className={`text-2xl font-bold ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                        {currency}{amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${colorClass}`}>
                    <Icon name={icon} className="w-6 h-6" />
                </div>
            </div>
        </Card>
    )
}

const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Shopping', 'Housing', 'Utilities', 
  'Entertainment', 'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Other'
];

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Filter & Sort State
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterType, setFilterType] = useState<TransactionType | 'All'>('All');
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Balance Edit State
  const [tempBalance, setTempBalance] = useState('');

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start splash screen transition
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000); // Start fade out after 2s
    const removeTimer = setTimeout(() => setShowSplash(false), 2500); // Remove from DOM after 2.5s

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const data = loadTransactions();
    const initBal = loadInitialBalance();
    setTransactions(data);
    setInitialBalance(initBal);
    
    const theme = loadTheme();
    const savedCurrency = loadCurrency();
    setIsDarkMode(theme);
    setCurrency(savedCurrency);
    if (theme) document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveInitialBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    saveCurrency(currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => prev === '$' ? '₹' : '$');
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
    setIsAddModalOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to delete all data? This cannot be undone.")) {
      clearAllData();
      setTransactions([]);
      setInitialBalance(0);
      setInsights([]);
      setCurrency('$');
      setIsDarkMode(false);
      // Reset filter states
      resetFilters();
    }
  };

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    // Total Balance = Initial Balance Offset + Total Income - Total Expense
    const balance = initialBalance + income - expense;
    return { income, expense, balance, rawNet: income - expense };
  }, [transactions, initialBalance]);

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const newTargetBalance = parseFloat(tempBalance);
    if (isNaN(newTargetBalance)) return;

    // Reconciliation Logic:
    // Target Balance = NewInitialBalance + (Total Income - Total Expenses)
    // Therefore: NewInitialBalance = Target Balance - (Total Income - Total Expenses)
    
    // We calculate the net flow from transactions (income - expense)
    const netFlow = totals.rawNet;
    
    // The new initial balance is simply the difference needed to reach the target
    const newInitialBalance = newTargetBalance - netFlow;
    
    setInitialBalance(newInitialBalance);
    setIsBalanceModalOpen(false);
    setTempBalance('');
  };

  const openBalanceModal = () => {
    setTempBalance(totals.balance.toString());
    setIsBalanceModalOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesDateStart = !startDate || t.date >= startDate;
      const matchesDateEnd = !endDate || t.date <= endDate;
      return matchesCategory && matchesType && matchesDateStart && matchesDateEnd;
    }).sort((a, b) => {
      if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'amount-desc') return b.amount - a.amount;
      if (sortOption === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, filterCategory, filterType, startDate, endDate, sortOption]);

  const resetFilters = () => {
    setFilterCategory('All');
    setFilterType('All');
    setStartDate('');
    setEndDate('');
    setSortOption('date-desc');
  };

  const generateInsights = async () => {
    setLoadingInsights(true);
    const data = await getSpendingInsights(transactions, currency);
    setInsights(data);
    setLoadingInsights(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;

    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    try {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
      const csvRows = [headers.join(',')];

      for (const row of dataToExport) {
        const date = row.date || new Date().toISOString().split('T')[0];
        const desc = (row.description || 'No Description').replace(/"/g, '""'); // Escape double quotes
        const cat = row.category || 'Uncategorized';
        const type = row.type || 'expense';
        // Ensure amount is a number and formatted as string for CSV
        const amount = Number(row.amount || 0).toFixed(2);

        // Wrap fields in quotes to handle commas and special chars
        const rowString = [
          `"${date}"`,
          `"${desc}"`,
          `"${cat}"`,
          `"${type}"`,
          `${amount}`,
          `"${currency}"`
        ].join(',');

        csvRows.push(rowString);
      }

      // Add Byte Order Mark (BOM) for Excel UTF-8 compatibility
      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `smartspend_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to generate CSV file.");
    }
  };

  // Views
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
            label="Total Balance" 
            amount={totals.balance} 
            icon="Wallet" 
            currency={currency} 
            onEdit={openBalanceModal}
        />
        <StatCard label="Monthly Income" amount={totals.income} type="income" icon="TrendingUp" currency={currency} />
        <StatCard label="Monthly Expenses" amount={totals.expense} type="expense" icon="TrendingDown" currency={currency} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Spending Overview">
           <WeeklyBarChart transactions={transactions} currency={currency} />
        </Card>
        
        <Card title="Smart Insights" action={
            <button 
                onClick={generateInsights} 
                disabled={loadingInsights}
                className="text-xs flex items-center gap-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors"
            >
                {loadingInsights ? <Icon name="Loader2" className="animate-spin w-3 h-3"/> : <Icon name="Sparkles" className="w-3 h-3"/>}
                Refresh AI
            </button>
        }>
            {insights.length === 0 && !loadingInsights ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    Tap the button to analyze your spending habits with Gemini AI.
                </div>
            ) : (
                <div className="space-y-3">
                    {insights.map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 text-sm ${
                            insight.type === 'warning' ? 'bg-orange-50 border-orange-400 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                            insight.type === 'positive' ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' :
                            'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                        }`}>
                            <p className="font-semibold mb-1">{insight.title}</p>
                            <p className="opacity-90">{insight.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
      </div>

      <Card title="Recent Transactions">
        <div className="space-y-4">
          {transactions.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Icon name={t.type === 'income' ? 'ArrowUpRight' : 'ArrowDownLeft'} className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium dark:text-gray-200">{t.description}</p>
                  <p className="text-xs text-gray-500">{t.date} • {t.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {t.type === 'income' ? '+' : '-'}{currency}{Number(t.amount).toLocaleString(currency === '₹' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
                </p>
                <button onClick={() => deleteTransaction(t.id)} className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Delete
                </button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center text-gray-500 py-4">No transactions yet.</p>}
        </div>
      </Card>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
       <Card title="Expense Breakdown">
           <ExpensePieChart transactions={transactions} currency={currency} />
       </Card>
       <Card title="Income vs Expenses">
           <WeeklyBarChart transactions={transactions} currency={currency} />
       </Card>
    </div>
  );

  const HistoryView = () => (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h2 className="text-xl font-bold dark:text-white">Transactions</h2>
          <div className="flex gap-2">
            <button 
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors active:scale-95"
            >
                <Icon name="FilterX" className="w-4 h-4" />
                <span className="hidden md:inline">Clear</span>
            </button>
            <button 
                type="button"
                onClick={exportToCSV}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/30 px-3 py-2 rounded-lg transition-colors active:scale-95 transform"
            >
                <Icon name="Download" className="w-4 h-4" />
                <span>Export CSV</span>
            </button>
          </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-3">
         <div className="col-span-1">
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Sort By</label>
             <div className="relative">
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white appearance-none"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                </select>
                <Icon name="ChevronDown" className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
             </div>
         </div>
         <div className="col-span-1">
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Category</label>
             <div className="relative">
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="w-full text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white appearance-none"
                >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Icon name="ChevronDown" className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
             </div>
         </div>
         <div className="col-span-1 md:col-span-1">
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Type</label>
             <div className="relative">
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white appearance-none"
                >
                    <option value="All">All Types</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
                <Icon name="ChevronDown" className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
             </div>
         </div>
         <div className="col-span-1">
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">From</label>
             <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
             />
         </div>
         <div className="col-span-2 md:col-span-1">
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">To</label>
             <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
             />
         </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.map(t => (
            <Card key={t.id} className="!p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Icon name={t.category === 'Food' ? 'Utensils' : t.category === 'Transport' ? 'Car' : 'DollarSign'} className="w-5 h-5" />
                    </div>
                    <div>
                    <p className="font-bold text-gray-900 dark:text-white">{t.description}</p>
                    <p className="text-sm text-gray-500">{t.date} • {t.category}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{currency}{Number(t.amount).toLocaleString(currency === '₹' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                </div>
                </div>
            </Card>
        ))}
        {filteredTransactions.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <Icon name="SearchX" className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No transactions found matching your filters.</p>
                <button onClick={resetFilters} className="text-primary-600 text-sm font-medium mt-2 hover:underline">
                    Clear all filters
                </button>
            </div>
        )}
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6 pb-20">
       <Card title="Preferences">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between py-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                       <Icon name="Moon" className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-gray-500">Switch between light and dark themes</p>
                    </div>
                 </div>
                 <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                 >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
            </div>

            <div className="flex items-center justify-between py-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                       <Icon name="DollarSign" className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Currency</p>
                        <p className="text-xs text-gray-500">Select your preferred currency symbol</p>
                    </div>
                 </div>
                 <button
                    onClick={toggleCurrency}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                 >
                    {currency === '$' ? 'Dollar ($)' : 'Rupee (₹)'}
                    <Icon name="ChevronDown" className="w-4 h-4" />
                 </button>
            </div>
          </div>
       </Card>

       <Card title="Data Management">
            <div className="py-2">
                <button 
                    onClick={handleResetApp}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-red-100 dark:border-red-900/30"
                >
                    <Icon name="Trash2" className="w-5 h-5" />
                    Reset All App Data
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                    This will permanently delete all transactions, budget settings, and history. This action cannot be undone.
                </p>
            </div>
       </Card>

       <div className="text-center py-8 opacity-75">
            <AppIcon className="w-16 h-16 mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">SmartSpend AI</h3>
            <p className="text-sm text-gray-500">Version 1.0.0</p>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">Created by Nirmalya</p>
       </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 md:pb-0 md:pl-64 transition-colors duration-200`}>
      
      {/* Splash Screen */}
      {showSplash && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary-600 transition-opacity duration-500 ease-out ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="bg-white p-6 rounded-[2rem] shadow-2xl transform transition-transform duration-1000 animate-[bounce_3s_infinite]">
                    <AppIcon className="w-24 h-24 text-primary-600" />
                </div>
                <h1 className="mt-6 text-3xl font-bold text-white tracking-tight animate-pulse">SmartSpend</h1>
            </div>
            <div className="pb-12 text-primary-100 font-medium text-sm tracking-wide opacity-80">
                Created by Nirmalya
            </div>
        </div>
      )}

      {/* Sidebar / Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:right-auto md:w-64 bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 z-40 md:h-screen pb-[env(safe-area-inset-bottom)] md:pb-0">
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-gray-100 dark:border-gray-700">
            <AppIcon className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">SmartSpend</span>
        </div>
        
        <div className="flex md:flex-col justify-around md:justify-start md:p-4 gap-1 md:gap-2 h-16 md:h-auto items-center md:items-stretch">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
                { id: 'history', label: 'History', icon: 'History' },
                { id: 'settings', label: 'Settings', icon: 'Settings' },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${
                        activeTab === item.id 
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    <Icon name={item.icon as any} className={`w-6 h-6 md:w-5 md:h-5 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} />
                    <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
                </button>
            ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto pt-[calc(env(safe-area-inset-top)+2.5rem)] md:pt-8">
        <header className="flex justify-between items-center mb-8">
            <div className="md:hidden flex items-center gap-2">
                 <AppIcon className="w-8 h-8 text-primary-600" />
                <span className="font-bold text-lg">SmartSpend</span>
            </div>
            
            <h1 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {activeTab}
            </h1>

            <div className="flex gap-2">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-transform active:scale-95"
                >
                    <Icon name="Plus" className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Transaction</span>
                </button>
            </div>
        </header>

        <div className="animate-in fade-in duration-300 slide-in-from-bottom-4">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'history' && <HistoryView />}
            {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Floating Chat Bot */}
      <ChatBot transactions={transactions} initialBalance={initialBalance} currency={currency} />

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction">
        <TransactionForm onSubmit={addTransaction} onCancel={() => setIsAddModalOpen(false)} currency={currency} />
      </Modal>

      {/* Edit Balance Modal */}
      <Modal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} title="Update Balance">
         <form onSubmit={handleUpdateBalance} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your current actual wallet/bank balance. The app will automatically adjust your history to match this amount.
            </p>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Wallet Balance</label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{currency}</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={tempBalance}
                        onChange={(e) => setTempBalance(e.target.value)}
                        className="block w-full pl-7 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:text-white text-lg"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>
            <div className="flex gap-4 pt-2">
                <button
                type="button"
                onClick={() => setIsBalanceModalOpen(false)}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30"
                >
                Update Balance
                </button>
            </div>
         </form>
      </Modal>
    </div>
  );
}

export default App;