import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Calculator, History, LogOut, ShieldCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { t } from '../../i18n/i18n';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { language, profile, isAdmin, signOut } = useFinance();
  const location = useLocation();
  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard', language), end: true },
    { to: '/chits', icon: Users, label: t('chitFundManager', language), end: false },
    { to: '/loans', icon: CreditCard, label: t('loanTracker', language), end: false },
    { to: '/calculator', icon: Calculator, label: t('interestCalculator', language), end: false },
    { to: '/history', icon: History, label: t('history', language), end: false },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin Settings', end: false }] : []),
  ];
  return (
    <div className="w-64 mesh-gradient text-white flex flex-col h-full border-r border-white/5">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-800">
          <img src="/logo.png" alt="Finance Kit Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-none">{t('appTitle', language)}</p>
          <p className="text-slate-500 text-xs mt-0.5">Finance Manager</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to || (link.end === false && location.pathname.startsWith(link.to));
            
            return (
              <li key={link.to}>
                <MotionLink
                  to={link.to}
                  onClick={onClose}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative overflow-hidden ${
                    isActive 
                      ? 'bg-fintech-primary text-white shadow-luxury' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-fintech-accent transition-colors'} />
                  </motion.div>
                  {link.label}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-white rounded-full"
                    />
                  )}
                </MotionLink>
              </li>
            );
          })}
        </ul>
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
