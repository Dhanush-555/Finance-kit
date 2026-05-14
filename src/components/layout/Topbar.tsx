import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Globe, Menu, Bell, LogOut } from 'lucide-react';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Topbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { language, setLanguage, loans, chits, signOut, profile } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
          onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
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

        <div className="relative">
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-100 bg-emerald-500 hover:ring-emerald-200 transition-all"
          >
            <img src="/logo.png" alt="User Profile" className="w-full h-full object-cover" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Account</p>
                <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
              </div>
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-bold"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

