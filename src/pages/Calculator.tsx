import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { calculateSimpleInterest, calculateCompoundInterest, calculateEMI } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const Calculator: React.FC = () => {
  const { language } = useFinance();
  const [type, setType] = useState<'simple' | 'compound' | 'emi'>('simple');
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [time, setTime] = useState(1); // years for simple/compound, months for emi
  const [frequency, setFrequency] = useState(12); // compounding frequency
  const [ratePeriod, setRatePeriod] = useState<'monthly' | 'annual'>('annual');
  const [emiFrequency, setEmiFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const results = useMemo(() => {
    const isMonthly = ratePeriod === 'monthly';
    if (type === 'simple') {
      const annualRate = isMonthly ? rate * 12 : rate;
      return calculateSimpleInterest(principal, annualRate, time);
    } else if (type === 'compound') {
      const annualRate = isMonthly ? rate * 12 : rate;
      return calculateCompoundInterest(principal, annualRate, time, frequency);
    } else {
      let installments = time;
      if (emiFrequency === 'daily') installments = time * 30;
      else if (emiFrequency === 'weekly') installments = Math.round(time * 4.3333);
      
      const emi = calculateEMI(principal, rate, installments, isMonthly, emiFrequency);
      return {
        emi,
        total: emi * installments,
        interest: (emi * installments) - principal
      };
    }
  }, [type, principal, rate, time, frequency, ratePeriod, emiFrequency]);

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
                min="0"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate</label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2 pr-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setRatePeriod('monthly')}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${ratePeriod === 'monthly' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                  >MONTHLY</button>
                  <button 
                    onClick={() => setRatePeriod('annual')}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${ratePeriod === 'annual' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                  >ANNUAL</button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === 'emi' ? 'Tenure (Months)' : 'Time (Years)'}
              </label>
              <input
                type="number"
                min="1"
                value={time}
                onChange={(e) => setTime(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <AnimatePresence mode="wait">
              {type === 'emi' && (
                <motion.div
                  key="emi"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repayment Frequency</label>
                  <select
                    value={emiFrequency}
                    onChange={(e) => setEmiFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </motion.div>
              )}
              {type === 'compound' && (
                <motion.div
                  key="compound"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 break-all">₹{results.interest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 overflow-hidden">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-700 break-all">₹{results.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
             </div>
              {type === 'emi' && 'emi' in results && (
               <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mb-1">
                    {emiFrequency === 'monthly' ? 'Monthly EMI' : (emiFrequency === 'weekly' ? 'Weekly Installment' : 'Daily Installment')}
                  </p>
                  <p className="text-2xl font-bold text-indigo-700 break-all">₹{results.emi.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
               </div>
              )}
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
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
