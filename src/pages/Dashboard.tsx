import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { TrendingUp, TrendingDown, Wallet, Calendar, CheckCircle, Percent, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateSmartSuggestions } from '../utils/suggestionEngine';
import { SuggestionCard } from '../components/finance/SuggestionCard';
import { NumberCounter } from '../components/common/NumberCounter';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 }
  }
};

import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { language, loans, chits, transactions, isAdmin, isStealthMode } = useFinance();

  // Smart notification check
  React.useEffect(() => {
    if (!isAdmin) return;

    const soonDue = loans
      .flatMap(l => l.emis.map(e => ({ ...e, person: l.borrowerOrLenderName })))
      .filter(e => e.status === 'pending')
      .filter(e => {
        const diff = new Date(e.dueDate).getTime() - new Date().getTime();
        return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000; // 2 days
      });

    if (soonDue.length > 0) {
      toast(`You have ${soonDue.length} payments due soon!`, {
        icon: '🔔',
        duration: 5000,
      });
    }
  }, [loans, isAdmin]);

  const totalLent = loans.filter(l => l.type === 'given').reduce((acc, curr) => acc + curr.principal, 0);

  const totalBorrowed = loans.filter(l => l.type === 'taken').reduce((acc, curr) => acc + curr.principal, 0);
  
  const totalCommission = transactions
    .filter(t => t.type === 'foreman_commission')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const stats = [
    { label: t('totalLent', language), value: totalLent, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('totalBorrowed', language), value: totalBorrowed, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Commission Earned', value: totalCommission, icon: Percent, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Net Liquidity', value: totalLent - totalBorrowed + totalCommission, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const chartData = [
    { name: 'Lent', value: totalLent, color: '#10b981' },
    { name: 'Borrowed', value: totalBorrowed, color: '#f43f5e' },
    { name: 'Commission', value: totalCommission, color: '#f59e0b' },
  ];

  const upcomingPayments = loans
    .flatMap(l => l.emis.map(e => ({ ...e, person: l.borrowerOrLenderName, type: 'EMI' })))
    .filter(e => e.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const allSuggestions = loans.flatMap(l => generateSmartSuggestions(l)).slice(0, 3);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter premium-text-gradient">{t('dashboard', language)}</h2>
          <p className="text-slate-400 font-medium tracking-tight text-sm">Overview of your financial ecosystem.</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 luxury-shadow">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Live</span>
          </div>

        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-[2rem] transition-all duration-300"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <NumberCounter 
              value={stat.value as number} 
              prefix="₹" 
              isCurrency={true} 
              className={`text-3xl font-black tracking-tighter ${stat.color} ${isStealthMode ? 'blur-md select-none' : ''}`} 
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-fintech-card p-8 rounded-3xl border border-fintech-border shadow-luxury">
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

          {allSuggestions.length > 0 && (
            <div className="bg-fintech-card p-8 rounded-3xl border border-fintech-border shadow-luxury">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={20} className="text-amber-500" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Smart Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSuggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-fintech-card p-8 rounded-3xl border border-fintech-border shadow-luxury self-start">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Pending Items</h3>
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {upcomingPayments.map((emi, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="group flex items-center gap-4 p-4 bg-fintech-bg hover:bg-emerald-50 rounded-2xl border border-fintech-border hover:border-emerald-100 transition-all cursor-pointer"
              >
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
              </motion.div>
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
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

