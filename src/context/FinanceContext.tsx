import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { Login } from '../pages/Login';
import type { ChitGroup, Loan, Transaction } from '../types';
import type { Language } from '../i18n/i18n';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

interface FinanceContextType {
  chits: ChitGroup[];
  setChits: React.Dispatch<React.SetStateAction<ChitGroup[]>>;
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  user: any;
  profile: UserProfile | null;
  allProfiles: UserProfile[];
  isAdmin: boolean;
  role: string;
  liveInterest: number;
  isStealthMode: boolean;
  toggleStealthMode: () => void;
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;
  signOut: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  const [chits, setChits, chitsLoading] = useSupabaseSync<ChitGroup>('chits');
  const [loans, setLoans, loansLoading] = useSupabaseSync<Loan>('loans');
  const [transactions, setTransactions, txLoading] = useSupabaseSync<Transaction>('transactions');
  const [language, setLanguage] = useLocalStorage<Language>('financekit_language', 'en');
  const [isStealthMode, setIsStealthMode] = useLocalStorage<boolean>('financekit_stealth', false);
  const [liveInterest, setLiveInterest] = useState(0);

  const toggleStealthMode = () => setIsStealthMode(prev => !prev);

  // Live Interest Logic (Global)
  useEffect(() => {
    const totalLent = loans.filter(l => l.type === 'given').reduce((acc, curr) => acc + curr.principal, 0);
    const interestPerSecond = (totalLent * 0.12) / (365 * 24 * 60 * 60);

    const timer = setInterval(() => {
      setLiveInterest(prev => prev + interestPerSecond);
    }, 1000);
    return () => clearInterval(timer);
  }, [loans]);

  useEffect(() => {
    // Fast Check: If there's no active Supabase auth token key in localStorage, bypass loading immediately
    const hasLocalSession = Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (!hasLocalSession) {
      setAuthLoading(false);
    }

    // Safety Timeout: Force stop loading after 3 seconds if stuck
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchAllProfiles();
      }
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchAllProfiles();
      }
      else {
        setProfile(null);
        setAllProfiles([]);
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is fine
        console.error('Profile fetch error:', error);
      }
      
      if (data) setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*');
      
      if (data) setAllProfiles(data);
    } catch (err) {
      console.error('Error fetching all profiles:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      
      // If updating self, update local profile too
      if (userId === session?.user.id) {
        setProfile(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Force redirect to home/login
  };

  const isLoading = authLoading || 
                    (session && ((chitsLoading && chits.length === 0) || 
                    (loansLoading && loans.length === 0) || 
                    (txLoading && transactions.length === 0)));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Glowing luxury background mesh */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-emerald-500/5 to-fintech-gold/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex flex-col items-center gap-6 z-10 p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 max-w-sm w-full mx-4 shadow-2xl text-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800">
             {/* Spinning Gold accent ring */}
             <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-fintech-gold/30 animate-spin" style={{ animationDuration: '6s' }}></div>
             <ShieldCheck className="w-8 h-8 text-fintech-gold animate-pulse" />
          </div>
          <div className="space-y-1.5">
             <h4 className="text-white font-black text-lg tracking-tight">Securing Your Session</h4>
             <p className="text-slate-400 text-xs font-medium leading-relaxed px-4">Decrypting your secure financial vault & establishing encrypted database uplink...</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-900">
             <RefreshCw className="w-3.5 h-3.5 text-fintech-gold animate-spin" />
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Verifying Node</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const isAdmin = profile?.role === 'admin';

  // Filter data based on role
  const filteredLoans = isAdmin ? loans : loans.filter(l => l.user_id === session?.user.id);
  const filteredChits = isAdmin ? chits : chits.filter(c => c.members?.some((m: any) => m.id === session?.user.id));
  const filteredTransactions = isAdmin ? transactions : transactions.filter(t => t.user_id === session?.user.id);

  return (
    <FinanceContext.Provider value={{ 
      chits: filteredChits, setChits, 
      loans: filteredLoans, setLoans, 
      transactions: filteredTransactions, setTransactions, 
      language, setLanguage,
      user: session?.user,
      profile,
      allProfiles,
      isAdmin,
      role: profile?.role || 'user',
      liveInterest,
      isStealthMode,
      toggleStealthMode,
      updateUserRole,
      signOut
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
