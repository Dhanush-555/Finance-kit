import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { calculateSimpleInterest, calculateCompoundInterest, calculateEMI } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const Calculator: React.FC = () => {
  const { language } = useFinance();
  const [type, setType] = useState<'simple' | 'compound' | 'emi'>('simple');
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [time, setTime] = useState(1); // years for simple/compound, months for emi
  const [frequency, setFrequency] = useState(12); // compounding frequency

  const results = useMemo(() => {
    if (type === 'simple') {
      return calculateSimpleInterest(principal, rate, time);
    } else if (type === 'compound') {
      return calculateCompoundInterest(principal, rate, time, frequency);
    } else {
      const emi = calculateEMI(principal, rate, time);
      return {
        emi,
        total: emi * time,
        interest: (emi * time) - principal
      };
    }
  }, [type, principal, rate, time, frequency]);

  const chartData = [
    { name: 'Principal', value: principal },
    { name: 'Interest', value: results.interest }
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800">{t('interestCalculator', language)}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['simple', 'compound', 'emi'] as const).map((tType) => (
              <button
                key={tType}
                onClick={() => {
                  setType(tType);
                  if (tType === 'emi' && time < 12) setTime(12);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === tType ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tType.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === 'emi' ? 'Tenure (Months)' : 'Time (Years)'}
              </label>
              <input
                type="number"
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            {type === 'compound' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compounding Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value={12}>Monthly</option>
                  <option value={4}>Quarterly</option>
                  <option value={2}>Half-Yearly</option>
                  <option value={1}>Yearly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-xl font-bold text-slate-900">₹{results.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-emerald-700">₹{results.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
             </div>
             {type === 'emi' && 'emi' in results && (
               <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mb-1">Monthly EMI</p>
                  <p className="text-2xl font-bold text-indigo-700">₹{results.emi.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
               </div>
             )}
          </div>

          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
