import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { TrendingUp, TrendingDown, Wallet, Calendar, CheckCircle, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { language, loans, chits, transactions } = useFinance();

  const totalLent = loans.filter(l => l.type === 'given').reduce((acc, curr) => acc + curr.principal, 0);
  const totalBorrowed = loans.filter(l => l.type === 'taken').reduce((acc, curr) => acc + curr.principal, 0);
  
  const totalCommission = transactions
    .filter(t => t.type === 'foreman_commission')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const stats = [
    { label: t('totalLent', language), value: `₹${totalLent.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('totalBorrowed', language), value: `₹${totalBorrowed.toLocaleString()}`, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Commission Earned', value: `₹${totalCommission.toLocaleString()}`, icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Net Liquidity', value: `₹${(totalLent - totalBorrowed + totalCommission).toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const chartData = [
    { name: 'Lent', value: totalLent, color: '#3b82f6' },
    { name: 'Borrowed', value: totalBorrowed, color: '#f97316' },
    { name: 'Commission', value: totalCommission, color: '#10b981' },
  ];

  const upcomingPayments = loans
    .flatMap(l => l.emis.map(e => ({ ...e, person: l.borrowerOrLenderName, type: 'EMI' })))
    .filter(e => e.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('dashboard', language)}</h2>
          <p className="text-slate-500 font-medium tracking-tight">Overview of your financial ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Distribution</h3>
             <div className="flex gap-4">
                {chartData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Pending Items</h3>
          <div className="space-y-4">
            {upcomingPayments.map((emi, i) => (
              <div key={i} className="group flex items-center gap-4 p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                   <Calendar size={20} />
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-black text-slate-900 truncate tracking-tight">{emi.person}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{emi.amount.toLocaleString()} • {new Date(emi.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto">
                   <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                </div>
              </div>
            ))}
            {upcomingPayments.length === 0 && (
              <div className="text-center py-16">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                    <CheckCircle size={40} className="text-emerald-400" />
                 </div>
                 <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No pending tasks</p>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-50">
               <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Active Chits</span>
                  <span className="text-emerald-600">{chits.filter(c => c.status === 'active').length} Groups</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

