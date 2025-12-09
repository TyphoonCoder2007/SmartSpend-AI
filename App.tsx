import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, SpendingInsight } from './types';
import { saveTransactions, loadTransactions, saveTheme, loadTheme, saveCurrency, loadCurrency } from './services/storageService';
import { getSpendingInsights } from './services/geminiService';
import { Icon } from './components/Icon';
import { Card } from './components/Card';
import { TransactionForm } from './components/TransactionForm';
import { ExpensePieChart, WeeklyBarChart } from './components/Charts';

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

const StatCard: React.FC<{ label: string; amount: number; type?: 'income' | 'expense' | 'neutral'; icon: any; currency: string }> = ({ label, amount, type = 'neutral', icon, currency }) => {
    const colorClass = type === 'income' ? 'text-emerald-500' : type === 'expense' ? 'text-rose-500' : 'text-primary-500';
    return (
        <Card className="flex-1 min-w-[140px]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
                    <h3 className={`text-2xl font-bold ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                        {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${colorClass}`}>
                    <Icon name={icon} className="w-6 h-6" />
                </div>
            </div>
        </Card>
    )
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const data = loadTransactions();
    setTransactions(data);
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

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const generateInsights = async () => {
    setLoadingInsights(true);
    const data = await getSpendingInsights(transactions);
    setInsights(data);
    setLoadingInsights(false);
  };

  // Views
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Balance" amount={totals.balance} icon="Wallet" currency={currency} />
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
                  {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
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
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">All Transactions</h2>
          <button className="text-sm text-primary-600 font-medium">Export CSV</button>
      </div>
      {transactions.map(t => (
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
                    {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
                </span>
                <button onClick={() => deleteTransaction(t.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Icon name="Trash2" className="w-4 h-4" />
                </button>
              </div>
            </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 md:pb-0 md:pl-64 transition-colors duration-200`}>
      {/* Sidebar / Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:right-auto md:w-64 bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 z-40 md:h-screen">
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Icon name="PieChart" className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">SmartSpend</span>
        </div>
        
        <div className="flex md:flex-col justify-around md:justify-start md:p-4 gap-1 md:gap-2 h-16 md:h-auto items-center md:items-stretch">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
                { id: 'history', label: 'History', icon: 'History' },
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
            
            <div className="hidden md:block my-4 border-t border-gray-100 dark:border-gray-700 mx-4"></div>
            
             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="hidden md:flex flex-row items-center gap-3 p-2 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            >
                <Icon name={isDarkMode ? 'Sun' : 'Moon'} className="w-5 h-5" />
                <span className="text-sm font-medium">Dark Mode</span>
            </button>
            <button
                onClick={toggleCurrency}
                className="hidden md:flex flex-row items-center gap-3 p-2 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            >
                <Icon name="DollarSign" className="w-5 h-5" />
                <span className="text-sm font-medium">Currency: {currency}</span>
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div className="md:hidden flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Icon name="PieChart" className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-lg">SmartSpend</span>
            </div>
            
            <h1 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {activeTab}
            </h1>

            <div className="flex gap-2">
                <button 
                    onClick={toggleCurrency}
                    className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold"
                >
                    {currency}
                </button>
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                    <Icon name={isDarkMode ? 'Sun' : 'Moon'} className="w-5 h-5" />
                </button>
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
        </div>
      </main>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction">
        <TransactionForm onSubmit={addTransaction} onCancel={() => setIsAddModalOpen(false)} currency={currency} />
      </Modal>
    </div>
  );
}

export default App;