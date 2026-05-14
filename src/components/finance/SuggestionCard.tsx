import React from 'react';
import type { FinanceSuggestion } from '../../utils/suggestionEngine';
import { Lightbulb, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: FinanceSuggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'saving': return <TrendingUp className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-red-500" size={20} />;
      case 'optimization': return <Lightbulb className="text-blue-500" size={20} />;
      case 'health': return <ShieldCheck className="text-indigo-500" size={20} />;
      default: return <Lightbulb className="text-slate-500" size={20} />;
    }
  };

  const getBg = () => {
    switch (suggestion.type) {
      case 'saving': return 'bg-emerald-50 border-emerald-100';
      case 'warning': return 'bg-red-50 border-red-100';
      case 'optimization': return 'bg-blue-50 border-blue-100';
      case 'health': return 'bg-indigo-50 border-indigo-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${getBg()} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{suggestion.title}</p>
          <p className="text-sm font-bold text-slate-900 mb-2 leading-tight">{suggestion.message}</p>
          {suggestion.impact && (
            <span className="inline-block px-2 py-0.5 rounded-lg bg-white text-[9px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 mb-3">
              Impact: {suggestion.impact}
            </span>
          )}
          {suggestion.actionLabel && (
            <button className="block w-full py-2 px-4 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 transition-all">
              {suggestion.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
