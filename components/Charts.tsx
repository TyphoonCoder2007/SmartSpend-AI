import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction } from '../types';

interface ChartsProps {
  transactions: Transaction[];
  currency: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Custom Tooltip Props Interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: string;
}

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload, currency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const locale = currency === '₹' ? 'en-IN' : 'en-US';
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="font-bold text-gray-900 dark:text-white text-lg">{data.name}</span>
            <span className="font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                {currency}{data.value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
        
        {data.topTransactions && data.topTransactions.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top 3 Expenses</p>
            {data.topTransactions.map((t: Transaction, idx: number) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[140px]">{t.description}</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-2">
                    {currency}{Number(t.amount).toLocaleString(locale)}
                    </span>
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                    <span>{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload, label, currency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const locale = currency === '₹' ? 'en-IN' : 'en-US';

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-gray-900 dark:text-white mb-3 text-lg border-b border-gray-100 dark:border-gray-700 pb-2">{label}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block">Income</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                     {currency}{data.income.toLocaleString(locale)}
                </span>
             </div>
             <div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block">Expense</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">
                     {currency}{data.expense.toLocaleString(locale)}
                </span>
             </div>
        </div>

        {data.topExpenses && data.topExpenses.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Daily Expenses</p>
            {data.topExpenses.map((t: Transaction, idx: number) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[140px]">{t.description}</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-2">
                       {currency}{Number(t.amount).toLocaleString(locale)}
                    </span>
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                     <span>{t.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ExpensePieChart: React.FC<ChartsProps> = ({ transactions, currency }) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  
  // Aggregate data by category and collect transactions
  const aggregatedData = expenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { 
        name: curr.category, 
        value: 0, 
        transactions: [] 
      };
    }
    // Ensure amount is treated as a number to prevent string concatenation bugs
    const amount = Number(curr.amount) || 0;
    acc[curr.category].value += amount;
    acc[curr.category].transactions.push(curr);
    return acc;
  }, {} as Record<string, { name: string; value: number; transactions: Transaction[] }>);

  // Process top 3 transactions per category
  const data = Object.values(aggregatedData).map((item: { name: string; value: number; transactions: Transaction[] }) => ({
    ...item,
    // Ensure value is properly rounded for display logic if needed, though charts handle floats well
    value: item.value,
    topTransactions: item.transactions
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 3)
  }));

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No expense data available</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeeklyBarChart: React.FC<ChartsProps> = ({ transactions, currency }) => {
  // Generate current week (Sunday to Saturday) using LOCAL time
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Move back to Sunday

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const data = weekDays.map(dateStr => {
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Get top 3 expenses for the day
    const topExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 3);
    
    // Create Date object safely from YYYY-MM-DD parts to avoid UTC shifting
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    return {
      date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: dateStr,
      income,
      expense,
      topExpenses
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }} 
            dy={10}
            interval={0} 
          />
          <YAxis hide />
          <Tooltip 
            content={<CustomBarTooltip currency={currency} />} 
            cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}
          />
          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};