import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Globe, Menu, Bell } from 'lucide-react';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Topbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { language, setLanguage, loans, chits } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifCount = [
    ...loans.flatMap(l => l.emis).filter(e => e.status === 'pending' && new Date(e.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    ...chits.filter(c => c.status === 'active')
  ].length;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu size={22} />
        </button>
        <span className="font-bold text-slate-800 text-base md:hidden">FinanceKit</span>
      </div>
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all relative"
        >
          <Bell size={20} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute top-12 right-0 z-50">
            <NotificationCenter />
          </div>
        )}

        <button
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-sm font-medium transition-all border border-transparent hover:border-emerald-200"
        >
          <Globe size={15} className="text-emerald-500" />
          {language === 'en' ? 'தமிழ்' : 'English'}
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-sm ring-2 ring-slate-100">
          DK
        </div>
      </div>
    </header>
  );
};

