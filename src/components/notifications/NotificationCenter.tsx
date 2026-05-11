import React from 'react';
import { Bell, Calendar, Gavel, CheckCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const NotificationCenter: React.FC = () => {
  const { loans, chits } = useFinance();

  const notifications = [
    ...loans.flatMap(l => l.emis)
      .filter(e => e.status === 'pending' && new Date(e.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
      .map(e => ({
        id: e.id,
        type: 'loan',
        title: 'Loan EMI Due',
        message: `₹${e.amount.toLocaleString()} is due on ${new Date(e.dueDate).toLocaleDateString()}`,
        icon: Calendar,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
      })),
    ...chits.filter(c => c.status === 'active')
      .map(c => ({
        id: c.id,
        type: 'chit',
        title: 'Upcoming Auction',
        message: `Auction for ${c.name} (Month ${c.currentMonth}) starts tomorrow.`,
        icon: Gavel,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
      }))
  ];

  return (
    <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase flex items-center gap-2">
           <Bell size={16} className="text-emerald-500" /> Notifications
        </h3>
        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{notifications.length}</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
             <CheckCircle size={40} className="mx-auto text-slate-100 mb-3" />
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">All caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="flex gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group">
              <div className={`shrink-0 w-10 h-10 ${n.bg} ${n.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <n.icon size={20} />
              </div>
              <div className="space-y-1">
                 <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{n.title}</p>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-slate-50 bg-slate-50/30">
         <button className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
            Mark all as read
         </button>
      </div>
    </div>
  );
};
