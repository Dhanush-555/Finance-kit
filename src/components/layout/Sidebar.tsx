import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Calculator, History, IndianRupee } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { t } from '../../i18n/i18n';
import { clsx } from 'clsx';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { language } = useFinance();
  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard', language), end: true },
    { to: '/chits', icon: Users, label: t('chitFundManager', language), end: false },
    { to: '/loans', icon: CreditCard, label: t('loanTracker', language), end: false },
    { to: '/calculator', icon: Calculator, label: t('interestCalculator', language), end: false },
    { to: '/history', icon: History, label: t('history', language), end: false },
  ];
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
          <IndianRupee size={20} className="text-white" />
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
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">DK</div>
          <div>
            <p className="text-slate-300 text-sm font-semibold">Dhanush</p>
            <p className="text-slate-500 text-xs">FinanceKit v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
