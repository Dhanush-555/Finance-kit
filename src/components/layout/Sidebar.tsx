import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Calculator, History, LogOut, ShieldCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { t } from '../../i18n/i18n';
import { clsx } from 'clsx';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { language, profile, isAdmin, signOut } = useFinance();
  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard', language), end: true },
    { to: '/chits', icon: Users, label: t('chitFundManager', language), end: false },
    { to: '/loans', icon: CreditCard, label: t('loanTracker', language), end: false },
    { to: '/calculator', icon: Calculator, label: t('interestCalculator', language), end: false },
    { to: '/history', icon: History, label: t('history', language), end: false },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin Settings', end: false }] : []),
  ];
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-800">
          <img src="/logo.png" alt="Finance Kit Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-none">{t('appTitle', language)}</p>
          <p className="text-slate-500 text-xs mt-0.5">Finance Manager</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={onClose}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm',
              isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}>
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
            <div className="flex items-center gap-1">
               {isAdmin && <ShieldCheck size={10} className="text-amber-500" />}
               <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{profile?.role || 'Guest'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};
