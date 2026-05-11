import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { Plus, CheckCircle, Trash2, BookOpen, Calendar, Info } from 'lucide-react';
import { calculateEMI, generateAmortizationSchedule } from '../utils/calculations';
import type { Loan } from '../types';

export const LoanTracker: React.FC = () => {
  const { language, loans, setLoans, setTransactions } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'given' as 'given' | 'taken',
    name: '',
    principal: 0,
    rate: 12,
    tenure: 12,
    interestType: 'reducing' as 'reducing' | 'flat',
    penalty: 50,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleAddLoan = () => {
    let emi = 0;
    if (formData.interestType === 'flat') {
      const totalInterest = (formData.principal * formData.rate * (formData.tenure / 12)) / 100;
      emi = (formData.principal + totalInterest) / formData.tenure;
    } else {
      emi = calculateEMI(formData.principal, formData.rate, formData.tenure);
    }

    const emis = generateAmortizationSchedule(formData.principal, formData.rate, formData.tenure, new Date(formData.date), formData.interestType)
      .map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        dueDate: item.dueDate,
        amount: item.emi,
        status: 'pending' as const,
        penalty: 0,
        balance: item.balance
      }));

    const newLoan: Loan = {
      id: Math.random().toString(36).substr(2, 9),
      type: formData.type,
      borrowerOrLenderName: formData.name,
      principal: formData.principal,
      interestRate: formData.rate,
      loanDate: formData.date,
      tenureMonths: formData.tenure,
      interestType: formData.interestType,
      emiAmount: emi,
      totalRepaymentAmount: emi * formData.tenure,
      status: 'active',
      emis: emis,
      penaltyRate: formData.penalty,
      notes: formData.notes
    };

    setLoans([...loans, newLoan]);
    setShowModal(false);
  };

  const markEMIPaid = (loanId: string, emiId: string) => {
    const updatedLoans = loans.map(loan => {
      if (loan.id === loanId) {
        const updatedEmis = loan.emis.map(emi => {
          if (emi.id === emiId) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const due = new Date(emi.dueDate);
            due.setHours(0,0,0,0);
            const isLate = today > due;
            const daysLate = isLate ? Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24)) : 0;
            const penalty = isLate ? (daysLate * (loan.penaltyRate || 0)) : 0;
            
            // Add Transaction
            setTransactions(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toISOString(),
              amount: emi.amount + penalty,
              type: loan.type === 'given' ? 'loan_emi_received' : 'loan_emi_paid',
              person: loan.borrowerOrLenderName,
              referenceId: loan.id,
              notes: `EMI Payment ${isLate ? '(Incl. Penalty)' : ''}`
            }]);

            return { 
              ...emi, 
              status: 'paid' as const, 
              paidDate: new Date().toISOString(),
              penalty: penalty
            };
          }
          return emi;
        });
        
        const allPaid = updatedEmis.every(e => e.status === 'paid');
        return { ...loan, emis: updatedEmis, status: allPaid ? 'closed' : 'active' as any };
      }
      return loan;
    });
    setLoans(updatedLoans);
  };

  const deleteLoan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this loan record?')) {
      setLoans(loans.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('loanTracker', language)}</h2>
          <p className="text-slate-500 text-sm">Professional Loan Ledger & Penalty Tracking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          {t('add', language)}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loans.map(loan => {
          const paidAmount = loan.emis.filter(e => e.status === 'paid').reduce((acc, curr) => acc + curr.amount + (curr.penalty || 0), 0);
          const totalExpected = loan.totalRepaymentAmount;
          const progress = (paidAmount / totalExpected) * 100;
          const pendingEmis = loan.emis.filter(e => e.status !== 'paid');
          const nextEmi = pendingEmis.length > 0 ? pendingEmis[0] : null;
          const remainingBalance = loan.emis.filter(e => e.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0);

          let overdueDays = 0;
          if (nextEmi) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const due = new Date(nextEmi.dueDate);
            due.setHours(0,0,0,0);
            if (today > due) {
              overdueDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
            }
          }

          return (
            <div key={loan.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${loan.type === 'given' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {loan.type}
                      </span>
                      <h3 className="font-black text-slate-900 text-xl tracking-tight">{loan.borrowerOrLenderName}</h3>
                    </div>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-1">
                      <Calendar size={14} /> Started: {new Date(loan.loanDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-black text-slate-900">₹{loan.principal.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('principal', language)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">EMI {t('amount', language)}</p>
                    <p className="font-bold text-slate-900">₹{loan.emiAmount?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Interest & Penalty</p>
                    <p className="font-bold text-slate-900">{loan.interestRate}% ({loan.interestType})</p>
                    <p className="text-[10px] text-red-500 font-bold tracking-tight">₹{loan.penaltyRate}/day late fee</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('emiPaid', language)}</p>
                    <p className="font-bold text-emerald-600">₹{paidAmount.toLocaleString()} ({loan.emis.filter(e => e.status === 'paid').length}/{loan.tenureMonths})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Remaining Balance</p>
                    <p className="font-bold text-orange-600">₹{remainingBalance.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl">
                  <div>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Next Due Date</p>
                     <p className="font-bold text-slate-900">{nextEmi ? new Date(nextEmi.dueDate).toLocaleDateString('en-IN') : 'Completed'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Overdue Days</p>
                     <p className={`font-bold ${overdueDays > 0 ? 'text-red-500' : 'text-slate-900'}`}>{overdueDays > 0 ? `${overdueDays} Days` : '-'}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Repayment Progress</span>
                      <span>{Math.round(progress)}%</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button 
                    onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                    className="text-emerald-600 text-xs font-black uppercase tracking-widest hover:text-emerald-700 flex items-center gap-2"
                  >
                    <BookOpen size={16}/> {expandedLoan === loan.id ? 'Close Ledger' : 'View Full Ledger'}
                  </button>
                  <button onClick={() => deleteLoan(loan.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>
              
              {expandedLoan === loan.id && (
                <div className="bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 md:p-8 overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr>
                               <th className="text-[10px] font-black text-slate-400 uppercase pb-4">Month</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">{t('date', language)}</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">EMI</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">Paid</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">{t('penalty', language)}</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">Balance</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">{t('status', language)}</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {loan.emis.map((emi, i) => {
                             const isOverdue = emi.status === 'pending' && new Date() > new Date(emi.dueDate);
                             // Calculate derived breakdown for display
                             const monthlyRate = loan.interestRate / (12 * 100);
                             const interestForMonth = loan.interestType === 'flat' 
                                ? (((loan.principal * loan.interestRate * (loan.tenureMonths / 12)) / 100) / loan.tenureMonths)
                                : (loan.principal * Math.pow(1 + monthlyRate, i)) * monthlyRate; 

                             return (
                               <tr key={emi.id}>
                                  <td className="py-3 text-sm font-bold text-slate-400">#{i + 1}</td>
                                  <td className="py-3 text-sm font-bold text-slate-900">{new Date(emi.dueDate).toLocaleDateString('en-IN')}</td>
                                  <td className="py-3 text-sm font-black text-slate-900 flex items-center gap-2 group relative">
                                    ₹{emi.amount.toLocaleString()}
                                    <Info size={12} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 top-8 hidden group-hover:block bg-slate-800 text-white p-2 rounded-lg text-[10px] z-50 w-32 shadow-xl border border-slate-700">
                                       <p className="flex justify-between"><span>{t('principal', language)}:</span> <span>₹{(emi.amount - interestForMonth).toFixed(0)}</span></p>
                                       <p className="flex justify-between text-amber-400"><span>{t('interest', language)}:</span> <span>₹{interestForMonth.toFixed(0)}</span></p>
                                    </div>
                                  </td>
                                  <td className="py-3 text-sm font-black text-emerald-600">
                                    {emi.status === 'paid' ? `₹${(emi.amount + (emi.penalty || 0)).toLocaleString()}` : '-'}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-red-500">
                                    {emi.penalty ? `₹${emi.penalty}` : (isOverdue ? 'Pending' : '-')}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-slate-500">
                                    {emi.status === 'paid' ? '₹0' : `₹${(emi as any).balance ? Math.round((emi as any).balance).toLocaleString() : '...'}`}
                                  </td>
                                  <td className="py-3">
                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${emi.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : (isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}`}>
                                        {emi.status.toUpperCase()} {isOverdue && ' (OVERDUE)'}
                                     </span>
                                  </td>
                                  <td className="py-3 text-right">
                                     {emi.status === 'pending' && (
                                       <button 
                                         onClick={() => markEMIPaid(loan.id, emi.id)}
                                         className="text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:text-white bg-emerald-100 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-all"
                                       >
                                         Receive
                                       </button>
                                     )}
                                     {emi.status === 'paid' && <CheckCircle size={16} className="text-emerald-500 ml-auto" />}
                                  </td>
                               </tr>
                             )
                           })}
                        </tbody>
                     </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create New Loan</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Loan Type</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setFormData({...formData, type: 'given'})}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.type === 'given' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >GIVEN</button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'taken'})}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.type === 'taken' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}
                    >TAKEN</button>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Counterparty Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="e.g. John Doe"/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Principal (₹)</label>
                    <input type="number" value={formData.principal} onChange={e => setFormData({...formData, principal: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Interest Rate (%)</label>
                    <input type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Interest Logic</label>
                    <select 
                      value={formData.interestType} 
                      onChange={e => setFormData({...formData, interestType: e.target.value as 'reducing' | 'flat'})} 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200"
                    >
                      <option value="reducing">Reducing Balance</option>
                      <option value="flat">Flat Interest</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Late Fee (₹ per day)</label>
                    <input type="number" value={formData.penalty} onChange={e => setFormData({...formData, penalty: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tenure (Months)</label>
                    <input type="number" value={formData.tenure} onChange={e => setFormData({...formData, tenure: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Agreement Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
               </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase text-xs tracking-widest">Cancel</button>
              <button onClick={handleAddLoan} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all uppercase text-xs tracking-widest">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

