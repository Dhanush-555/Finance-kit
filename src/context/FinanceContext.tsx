import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ChitGroup, Loan, Transaction } from '../types';
import type { Language } from '../i18n/i18n';

interface FinanceContextType {
  chits: ChitGroup[];
  setChits: React.Dispatch<React.SetStateAction<ChitGroup[]>>;
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chits, setChits] = useLocalStorage<ChitGroup[]>('financekit_chits', []);
  const [loans, setLoans] = useLocalStorage<Loan[]>('financekit_loans', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('financekit_transactions', []);
  const [language, setLanguage] = useLocalStorage<Language>('financekit_language', 'en');

  return (
    <FinanceContext.Provider value={{ chits, setChits, loans, setLoans, transactions, setTransactions, language, setLanguage }}>
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
