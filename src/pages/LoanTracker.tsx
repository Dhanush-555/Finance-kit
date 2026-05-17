import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { Plus, Calendar, CheckCircle, Trash2, Edit2, FileText, MessageCircle, Sparkles, BookOpen } from 'lucide-react';
import { generateReceiptPDF, sendWhatsAppReceipt } from '../utils/receiptGenerator';
import { calculateEMI, generateAmortizationSchedule } from '../utils/calculations';
import { analyzeLoanHealth, generateSmartSuggestions } from '../utils/suggestionEngine';
import { SuggestionCard } from '../components/finance/SuggestionCard';
import type { Loan } from '../types';
import confetti from 'canvas-confetti';

export const LoanTracker: React.FC = () => {
  const { language, loans, setLoans, setTransactions, isAdmin, user, allProfiles } = useFinance();
   const [showModal, setShowModal] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'given' as 'given' | 'taken',
    name: '',
    principal: '' as number | string,
    rate: 12 as number | string,
    tenure: 12 as number | string,
    interestType: 'reducing' as 'reducing' | 'flat',
    interestRatePeriod: 'monthly' as 'monthly' | 'annual',
    repaymentFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    penalty: 50 as number | string,
    date: new Date().toISOString().split('T')[0],
    category: 'personal' as 'personal' | 'gold' | 'business' | 'other',
    notes: '',
    assignedUserId: '' // New field for Admin to assign loan to a user
  });

  const handleAddLoan = () => {
    const isMonthly = formData.interestRatePeriod === 'monthly';
    const frequency = formData.repaymentFrequency;
    
    const numPrincipal = Number(formData.principal) || 0;
    const numRate = Number(formData.rate) || 0;
    const numTenure = Number(formData.tenure) || 0;
    const numPenalty = Number(formData.penalty) || 0;

    let installments = numTenure;
    if (frequency === 'daily') installments = numTenure * 30;
    else if (frequency === 'weekly') installments = Math.round(numTenure * 4.3333);

    let emi = 0;
    if (formData.interestType === 'flat') {
      let periodicRate = 0;
      if (isMonthly) {
        if (frequency === 'monthly') periodicRate = numRate / 100;
        else if (frequency === 'weekly') periodicRate = (numRate / (30/7)) / 100;
        else periodicRate = (numRate / 30) / 100;
      } else {
        if (frequency === 'monthly') periodicRate = numRate / (12 * 100);
        else if (frequency === 'weekly') periodicRate = numRate / (52 * 100);
        else periodicRate = numRate / (365 * 100);
      }
      const totalInterest = numPrincipal * periodicRate * installments;
      emi = (numPrincipal + totalInterest) / installments;
    } else {
      emi = calculateEMI(numPrincipal, numRate, installments, isMonthly, frequency);
    }

    const emis = generateAmortizationSchedule(numPrincipal, numRate, installments, new Date(formData.date), formData.interestType, isMonthly, frequency)
      .map(item => ({
        id: crypto.randomUUID(),
        dueDate: item.dueDate,
        amount: item.emi,
        status: 'pending' as const,
        penalty: 0,
        balance: item.balance,
        principalPaid: item.principal,
        interest: item.interest
      }));

    const newLoan: Loan = {
      id: editingLoanId || crypto.randomUUID(),
      type: formData.type,
      borrowerOrLenderName: formData.name,
      principal: numPrincipal,
      interestRate: numRate,
      loanDate: formData.date,
      tenureMonths: installments,
      tenureType: formData.repaymentFrequency,
      interestType: formData.interestType,
      interestRatePeriod: formData.interestRatePeriod,
      emiAmount: emi,
      totalRepaymentAmount: emi * installments,
      status: 'active',
      emis: emis,
      category: formData.category,
      notes: formData.notes,
      user_id: formData.assignedUserId || user?.id, // Assign to selected user or fallback to self
    };

    if (editingLoanId) {
      setLoans(loans.map(l => l.id === editingLoanId ? newLoan : l));
    } else {
      setLoans([...loans, newLoan]);
    }
    
    setShowModal(false);
    setEditingLoanId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'given',
      name: '',
      principal: 0,
      rate: 12,
      tenure: 12,
      interestType: 'reducing',
      interestRatePeriod: 'monthly',
      repaymentFrequency: 'monthly',
      penalty: 50,
      date: new Date().toISOString().split('T')[0],
      category: 'personal',
      notes: '',
      assignedUserId: ''
    });
  };

  const handleEditClick = (loan: Loan) => {
    setEditingLoanId(loan.id);
    setFormData({
      type: loan.type,
      name: loan.borrowerOrLenderName,
      principal: loan.principal,
      rate: loan.interestRate,
      tenure: loan.tenureType === 'monthly' ? loan.tenureMonths : (loan.tenureType === 'daily' ? loan.tenureMonths / 30 : loan.tenureMonths / 4.3333),
      interestType: loan.interestType,
      interestRatePeriod: loan.interestRatePeriod || 'monthly',
      repaymentFrequency: loan.tenureType,
      penalty: loan.penaltyRate || 50,
      date: loan.loanDate,
      category: loan.category || 'personal',
      notes: loan.notes || '',
      assignedUserId: loan.user_id || ''
    });
    setShowModal(true);
  };

  const markEMIPaid = (loanId: string, emiId: string) => {
    if (!isAdmin) return; // Secure the function itself

    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const emi = loan.emis.find(e => e.id === emiId);
    if (!emi) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(emi.dueDate);
    due.setHours(0,0,0,0);
    const isLate = today > due;
    const daysLate = isLate ? Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24)) : 0;
    const calculatedPenalty = isLate ? (daysLate * (loan.penaltyRate || 0)) : 0;
    
    let penalty = calculatedPenalty;
    if (isLate) {
      const promptResult = window.prompt(`EMI Amount: ₹${Math.round(emi.amount)}\nCalculated Late Fee (${daysLate} days): ₹${calculatedPenalty}\n\nEnter final Late Fee to collect (can be 0):`, calculatedPenalty.toString());
      if (promptResult === null) return; // User cancelled
      penalty = Number(promptResult);
      if (isNaN(penalty)) penalty = 0;
    }

    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        const updatedEmis = l.emis.map(e => {
          if (e.id === emiId) {
            return { 
              ...e, 
              status: 'paid' as const, 
              paidDate: new Date().toISOString(),
              penalty: penalty
            };
          }
          return e;
        });
        const allPaid = updatedEmis.every(e => e.status === 'paid');
        return { ...l, emis: updatedEmis, status: allPaid ? 'closed' : 'active' as any };
      }
      return l;
    });

    setTransactions(prev => [...prev, {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: emi.amount + penalty,
      type: loan.type === 'given' ? 'loan_emi_received' : 'loan_emi_paid',
      person: loan.borrowerOrLenderName,
      referenceId: loan.id,
      notes: `EMI Payment ${penalty > 0 ? '(Incl. Penalty ₹' + penalty + ')' : ''}`,
      user_id: loan.user_id
    }]);

    setLoans(updatedLoans);
    toast.success('Payment Received! 🎉');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#6366f1']
    });
  };

  const deleteLoan = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this loan record?')) {
      setLoans(loans.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('loanTracker', language)}</h2>
          <p className="text-slate-500 text-sm">{isAdmin ? 'Professional Loan Ledger & Portfolio Tracking' : 'Your Personal Loan Dashboard'}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setEditingLoanId(null); setShowModal(true); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            {t('add', language)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loans.map(loan => {
          const paidAmount = loan.emis.filter(e => e.status === 'paid').reduce((acc, curr) => acc + curr.amount + (curr.penalty || 0), 0);
          const totalExpected = loan.totalRepaymentAmount;
          const progress = (paidAmount / totalExpected) * 100;
          const pendingEmis = loan.emis.filter(e => e.status !== 'paid');
          const nextEmi = pendingEmis.length > 0 ? pendingEmis[0] : null;
          const remainingBalance = loan.emis.filter(e => e.status !== 'paid').reduce((acc, curr) => acc + (curr.principalPaid !== undefined ? curr.principalPaid : curr.amount), 0);

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

          const health = analyzeLoanHealth(loan);
          const loanSuggestions = generateSmartSuggestions(loan);

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
                    <div className="flex items-center md:justify-end gap-2">
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('principal', language)}</p>
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-100 ${health.color}`}>
                          Health: {health.status}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{loan.tenureType === 'monthly' ? 'EMI' : (loan.tenureType === 'weekly' ? 'Weekly' : 'Daily')} {t('amount', language)}</p>
                    <p className="font-bold text-slate-900">₹{loan.emiAmount?.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Interest & Frequency</p>
                    <p className="font-bold text-slate-900">
                      {loan.interestRate}% {loan.interestRatePeriod === 'monthly' ? 'Monthly' : 'Annual'} ({loan.tenureType})
                    </p>
                    <p className="text-[10px] text-red-500 font-bold tracking-tight">₹{loan.penaltyRate}/day late fee</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Repaid</p>
                    <p className="font-bold text-emerald-600">₹{paidAmount.toFixed(2)} ({loan.emis.filter(e => e.status === 'paid').length}/{loan.tenureMonths})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Balance</p>
                    <p className="font-bold text-orange-600">₹{remainingBalance.toFixed(2)}</p>
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

                {loanSuggestions.length > 0 && (
                  <div className="mt-6 space-y-3">
                     <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Smart Insights</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {loanSuggestions.map((s, i) => (
                           <SuggestionCard key={i} suggestion={s} />
                        ))}
                     </div>
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center">
                  <button 
                    onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                    className="text-emerald-600 text-xs font-black uppercase tracking-widest hover:text-emerald-700 flex items-center gap-2"
                  >
                    <BookOpen size={16}/> {expandedLoan === loan.id ? 'Close Ledger' : 'View Full Ledger'}
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleEditClick(loan)} className="text-slate-300 hover:text-blue-500 transition-colors">
                        <Edit2 size={20}/>
                      </button>
                      <button onClick={() => deleteLoan(loan.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {expandedLoan === loan.id && (
                <div className="bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 md:p-8 overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr>
                               <th className="text-[10px] font-black text-slate-400 uppercase pb-4">#</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">{t('date', language)}</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">Amount</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">Principal</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">Interest</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">{t('penalty', language)}</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">Total Paid</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-center">Balance</th>
                              <th className="text-[10px] font-black text-slate-400 uppercase pb-4">{t('status', language)}</th>
                              {isAdmin && <th className="text-[10px] font-black text-slate-400 uppercase pb-4 text-right">Action</th>}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {loan.emis.map((emi, i) => {
                             const isOverdue = emi.status === 'pending' && new Date() > new Date(emi.dueDate);
                             const principalForMonth = emi.principalPaid !== undefined ? emi.principalPaid : (emi.amount - (((loan.principal * loan.interestRate * (loan.tenureMonths / 12)) / 100) / loan.tenureMonths));
                             const interestForMonth = emi.interest !== undefined ? emi.interest : (emi.amount - principalForMonth);

                             return (
                               <tr key={emi.id}>
                                  <td className="py-3 text-sm font-bold text-slate-400">#{i + 1}</td>
                                  <td className="py-3 text-sm font-bold text-slate-900">{new Date(emi.dueDate).toLocaleDateString('en-IN')}</td>
                                  <td className="py-3 text-sm font-black text-slate-900 text-center">
                                    ₹{emi.amount.toFixed(2)}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-slate-600 text-center">
                                    ₹{principalForMonth.toFixed(2)}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-amber-600 text-center">
                                    ₹{interestForMonth.toFixed(2)}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-red-500 text-center">
                                    {emi.penalty ? `₹${emi.penalty.toFixed(2)}` : (isOverdue ? 'Pending' : '-')}
                                  </td>
                                  <td className="py-3 text-sm font-black text-emerald-600 text-center">
                                    {emi.status === 'paid' ? `₹${(emi.amount + (emi.penalty || 0)).toFixed(2)}` : '-'}
                                  </td>
                                  <td className="py-3 text-sm font-bold text-slate-500 text-center">
                                    {emi.status === 'paid' ? '₹0.00' : `₹${(emi as any).balance ? (emi as any).balance.toFixed(2) : '...'}`}
                                  </td>
                                  <td className="py-3">
                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${emi.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : (isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}`}>
                                        {emi.status.toUpperCase()} {isOverdue && ' (OVERDUE)'}
                                     </span>
                                  </td>
                                  {isAdmin && (
                                    <td className="py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {emi.status === 'pending' && (
                                          <button 
                                            onClick={() => markEMIPaid(loan.id, emi.id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:text-white bg-emerald-100 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-all"
                                          >
                                            Receive
                                          </button>
                                        )}
                                        {emi.status === 'paid' && (
                                          <>
                                            <button 
                                              onClick={async () => {
                                                const pdf = await generateReceiptPDF({
                                                  receiptNo: emi.id.slice(0, 8).toUpperCase(),
                                                  date: new Date().toLocaleDateString('en-IN'),
                                                  customerName: loan.borrowerOrLenderName,
                                                  amount: emi.amount + (emi.penalty || 0),
                                                  paymentFor: `EMI #${i + 1} for ${loan.borrowerOrLenderName}`,
                                                  paymentMode: 'Digital/Cash'
                                                });
                                                pdf.save(`Receipt_${loan.borrowerOrLenderName}_EMI${i+1}.pdf`);
                                              }}
                                              title="Download Receipt"
                                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                              <FileText size={16} />
                                            </button>
                                            <button 
                                              onClick={() => {
                                                sendWhatsAppReceipt('919999999999', { // Placeholder, ideally use borrower phone
                                                  customerName: loan.borrowerOrLenderName,
                                                  amount: emi.amount + (emi.penalty || 0),
                                                  paymentFor: `EMI #${i + 1} for ${loan.borrowerOrLenderName}`
                                                });
                                              }}
                                              title="Send WhatsApp"
                                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            >
                                              <MessageCircle size={16} />
                                            </button>
                                            <CheckCircle size={16} className="text-emerald-500" />
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  )}
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
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200 h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingLoanId ? 'Edit Loan' : 'Create New Loan'}</h3>
            <div className="space-y-4">
                {/* Assign to User Selection */}
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Assign to Borrower</label>
                   <select 
                     value={formData.assignedUserId} 
                     onChange={e => setFormData({...formData, assignedUserId: e.target.value})}
                     className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                   >
                     <option value="">Select a Registered User</option>
                     {allProfiles.map(p => (
                       <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                     ))}
                   </select>
                   <p className="text-[10px] text-slate-400 mt-1 italic">* This borrower will see this loan in their dashboard.</p>
                </div>

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
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Display Name (Counterparty)</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="e.g. John Doe"/>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Principal (₹)</label>
                     <input 
                       type="text" 
                       inputMode="decimal"
                       value={formData.principal} 
                       onChange={e => setFormData({...formData, principal: e.target.value.replace(/[^0-9.]/g, '')})} 
                       className="w-full px-4 py-2 rounded-xl border border-slate-200"
                     />
                 </div>
                 <div className="flex flex-col">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Interest Rate</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                              type="text" 
                              inputMode="decimal"
                              value={formData.rate} 
                              onChange={e => setFormData({...formData, rate: e.target.value.replace(/[^0-9.]/g, '')})} 
                              className="w-full px-4 py-2 pr-10 rounded-xl border border-slate-200"
                            />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           <button 
                              type="button"
                              onClick={() => setFormData({...formData, interestRatePeriod: 'monthly'})}
                              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${formData.interestRatePeriod === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                           >M</button>
                           <button 
                              type="button"
                              onClick={() => setFormData({...formData, interestRatePeriod: 'annual'})}
                              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${formData.interestRatePeriod === 'annual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                           >A</button>
                        </div>
                     </div>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <input type="text" inputMode="decimal" value={formData.penalty} onChange={e => setFormData({...formData, penalty: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tenure (Months)</label>
                     <input 
                       type="text" 
                       inputMode="numeric"
                       value={formData.tenure} 
                       onChange={e => setFormData({...formData, tenure: e.target.value.replace(/[^0-9]/g, '')})} 
                       className="w-full px-4 py-2 rounded-xl border border-slate-200"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</label>
                     <select 
                       value={formData.repaymentFrequency} 
                       onChange={e => setFormData({...formData, repaymentFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'})}
                       className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                     >
                       <option value="daily">Daily</option>
                       <option value="weekly">Weekly</option>
                       <option value="monthly">Monthly</option>
                     </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Agreement Date</label>
                     <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                     <select 
                       value={formData.category} 
                       onChange={e => setFormData({...formData, category: e.target.value as any})}
                       className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                     >
                       <option value="personal">Personal</option>
                       <option value="gold">Gold Loan</option>
                       <option value="business">Business</option>
                       <option value="other">Other</option>
                     </select>
                  </div>
                </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => { setShowModal(false); setEditingLoanId(null); resetForm(); }} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase text-xs tracking-widest">Cancel</button>
              <button onClick={handleAddLoan} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all uppercase text-xs tracking-widest">
                {editingLoanId ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
