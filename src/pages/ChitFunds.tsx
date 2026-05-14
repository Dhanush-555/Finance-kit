import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { Plus, Trash2, Users, Gavel, TrendingDown, X, UserPlus, Phone, CreditCard, MapPin, CheckCircle, History, IndianRupee } from 'lucide-react';
import { calculateChitDividend } from '../utils/calculations';
import type { ChitGroup, Member, Auction, MemberPayment, PaymentStatus } from '../types';

export const ChitFunds: React.FC = () => {
  const { language, chits, setChits, setTransactions, role } = useFinance();
  const isAdmin = role === 'admin';
  const [showModal, setShowModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState<string | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    totalValue: 500000,
    duration: 20,
    membersCount: 20,
    commission: 5,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [memberFormData, setMemberFormData] = useState({
    name: '',
    phone: '',
    aadhaar: '',
    address: ''
  });

  const [auctionData, setAuctionData] = useState({
    bidAmount: 0,
    winningMemberId: ''
  });

  const handleAddChit = () => {
    const contribution = formData.totalValue / formData.membersCount;
    const newChit: ChitGroup = {
      id: crypto.randomUUID(),
      name: formData.name,
      totalValue: formData.totalValue,
      durationMonths: formData.duration,
      memberCount: formData.membersCount,
      monthlyContribution: contribution,
      commissionPercentage: formData.commission,
      currentMonth: 1,
      startDate: formData.startDate,
      members: [],
      payments: [],
      auctions: [],
      status: 'active',
      notes: formData.notes
    };
    setChits([...chits, newChit]);
    setShowModal(false);
  };

  const handleAddMember = () => {
    if (!showMemberModal || !memberFormData.name) return;

    setChits(chits.map(chit => {
      if (chit.id === showMemberModal) {
        const newMember: Member = {
          id: crypto.randomUUID(),
          name: memberFormData.name,
          phone: memberFormData.phone,
          aadhaar: memberFormData.aadhaar,
          address: memberFormData.address,
          kycStatus: 'verified',
        };
        // Also initialize their payment record
        const newPaymentRecord: MemberPayment = {
          memberId: newMember.id,
          payments: []
        };
        return { 
          ...chit, 
          members: [...chit.members, newMember],
          payments: [...chit.payments, newPaymentRecord]
        };
      }
      return chit;
    }));

    setShowMemberModal(null);
    setMemberFormData({ name: '', phone: '', aadhaar: '', address: '' });
  };

  const runAuction = (chitId: string) => {
    const chit = chits.find(c => c.id === chitId);
    if (!chit) return;

    // Final Month Logic: No auction, last member gets full amount
    const isFinalMonth = chit.currentMonth === chit.durationMonths;
    let auctionResults = {
      dividendPerMember: 0,
      commission: (chit.totalValue * chit.commissionPercentage) / 100,
      bidAmount: chit.totalValue
    };

    if (!isFinalMonth) {
      const { dividendPerMember, commission } = calculateChitDividend(
        auctionData.bidAmount,
        chit.totalValue,
        chit.memberCount,
        chit.commissionPercentage
      );
      auctionResults = { dividendPerMember, commission, bidAmount: auctionData.bidAmount };
    } else {
      // Find the last member who hasn't won yet
      const wonMemberIds = chit.auctions.map(a => a.winningMemberId);
      const lastMember = chit.members.find(m => !wonMemberIds.includes(m.id));
      if (lastMember) {
        auctionData.winningMemberId = lastMember.id;
      }
    }

    const newAuction: Auction = {
      month: chit.currentMonth,
      winningMemberId: auctionData.winningMemberId,
      bidAmount: auctionResults.bidAmount,
      dividend: auctionResults.dividendPerMember,
      commission: auctionResults.commission,
      date: new Date().toISOString()
    };

    const monthlyPayable = chit.monthlyContribution - auctionResults.dividendPerMember;

    const updatedChits = chits.map(c => {
      if (c.id === chitId) {
        // Update all member payments for this month
        const updatedPayments = c.payments.map(mp => {
          const newStatus: PaymentStatus['status'] = 'pending';
          const newPayment: PaymentStatus = {
            month: c.currentMonth,
            status: newStatus,
            amount: monthlyPayable,
            dividend: auctionResults.dividendPerMember,
            paidDate: undefined
          };
          return { ...mp, payments: [...mp.payments, newPayment] };
        });

        return {
          ...c,
          currentMonth: c.currentMonth + 1,
          auctions: [...c.auctions, newAuction],
          payments: updatedPayments,
          status: c.currentMonth >= c.durationMonths ? 'completed' : 'active' as any
        };
      }
      return c;
    });

    // Record Foreman Commission & Prize Payout Transactions
    setTransactions(prev => {
      const newTransactions = [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: auctionResults.commission,
          type: 'foreman_commission' as const,
          person: 'System',
          referenceId: chit.id,
          notes: `Commission from Month ${chit.currentMonth} Auction`
        }
      ];
      
      if (auctionData.winningMemberId) {
        const winningMember = chit.members.find(m => m.id === auctionData.winningMemberId);
        newTransactions.push({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: auctionResults.bidAmount,
          type: 'chit_receive' as const,
          person: winningMember?.name || 'Unknown',
          referenceId: chit.id,
          notes: `Prize payout for Month ${chit.currentMonth}`
        });
      }
      
      return newTransactions;
    });

    setChits(updatedChits);
    setShowAuctionModal(null);
    setAuctionData({ bidAmount: 0, winningMemberId: '' });
  };

  const markPaymentPaid = (chitId: string, memberId: string, month: number) => {
    setChits(prev => prev.map(chit => {
      if (chit.id === chitId) {
        const updatedPayments = chit.payments.map(mp => {
          if (mp.memberId === memberId) {
            const updatedMonthPayments = mp.payments.map(p => {
              if (p.month === month) {
                const updatedP: PaymentStatus = { ...p, status: 'paid', paidDate: new Date().toISOString() };
                return updatedP;
              }
              return p;
            });
            return { ...mp, payments: updatedMonthPayments };
          }
          return mp;
        });
        return { ...chit, payments: updatedPayments };
      }
      return chit;
    }));

    // Add to Transactions
    const chit = chits.find(c => c.id === chitId);
    const member = chit?.members.find(m => m.id === memberId);
    const payment = chit?.payments.find(mp => mp.memberId === memberId)?.payments.find(p => p.month === month);
    
    if (member && payment) {
      setTransactions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: payment.amount,
          type: 'chit_contribution',
          person: member.name,
          referenceId: chitId,
          notes: `Chit Payment - Month ${month}`
        }
      ]);
    }
  };

  const deleteChit = (id: string) => {
    if (window.confirm('Delete this chit group?')) {
      setChits(chits.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('chitFundManager', language)}</h2>
          <p className="text-slate-500 text-sm">Authentic Auction-Based Bidding & Dividend Distribution</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            {t('add', language)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chits.map(chit => (
          <div key={chit.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div className="flex gap-2">
                   <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${chit.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                     {(chit.status || 'active').toUpperCase()}
                   </span>
                   {isAdmin && (
                     <button onClick={() => deleteChit(chit.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                       <Trash2 size={18} />
                     </button>
                   )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">{chit.name}</h3>
              <p className="text-emerald-600 font-black text-2xl mb-4">₹{chit.totalValue.toLocaleString()}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Month</p>
                  <p className="font-bold text-slate-700">{chit.currentMonth} / {chit.durationMonths}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t('amount', language)}</p>
                  <p className="font-bold text-slate-700">₹{chit.monthlyContribution.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-4">
                   {isAdmin && (
                     <button 
                       onClick={() => setShowMemberModal(chit.id)}
                       className="text-emerald-600 text-xs font-bold hover:text-emerald-700 flex items-center gap-1"
                       disabled={(chit.members || []).length >= chit.memberCount}
                     >
                       <Plus size={14} /> {t('add', language)}
                     </button>
                   )}
                  <button 
                    onClick={() => setShowLedgerModal(chit.id)}
                    className="text-indigo-600 text-xs font-bold hover:text-indigo-700 flex items-center gap-1"
                  >
                    <History size={14} /> LEDGER
                  </button>
                </div>
                <div className="flex -space-x-2">
                  {(chit.members || []).slice(0, 3).map((m) => (
                    <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600" title={m.name}>
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {(chit.members || []).length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      +{(chit.members || []).length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 bg-slate-50 p-6 border-l border-slate-100 flex flex-col justify-between">
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Auction Center</h4>
                  {isAdmin && (chit.members || []).length >= chit.memberCount && (
                    <button 
                      onClick={() => setShowAuctionModal(chit.id)}
                      disabled={chit.status === 'completed'}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                    >
                      <Gavel size={18} /> {chit.currentMonth === chit.durationMonths ? t('finalizeChit', language) : t('runAuction', language)}
                    </button>
                  )}
                  {!isAdmin && (
                    <div className="bg-slate-100 p-3 rounded-xl">
                       <p className="text-[10px] text-slate-500 font-bold leading-tight">View-only mode enabled</p>
                    </div>
                  )}
                  {isAdmin && (chit.members || []).length < chit.memberCount && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                       <p className="text-[10px] text-amber-700 font-bold leading-tight">Waiting for members ({(chit.members || []).length}/{chit.memberCount})</p>
                    </div>
                  )}
               </div>
               
               <div className="mt-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">{t('dividend', language)} Pool</p>
                  <div className="flex items-center gap-2 text-emerald-600">
                     <TrendingDown size={16} />
                     <p className="font-bold">₹{(((chit.auctions || [])[(chit.auctions || []).length - 1]?.dividend || 0) * chit.memberCount).toLocaleString()}</p>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">₹{(chit.auctions || [])[(chit.auctions || []).length - 1]?.dividend.toFixed(2) || '0.00'} per member</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Group Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create New Chit Group</h3>
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="e.g. Monthly Savings A"/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Value (₹)</label>
                    <input type="number" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission (%)</label>
                    <input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Months)</label>
                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Members</label>
                    <input type="number" value={formData.membersCount} onChange={e => setFormData({...formData, membersCount: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
                 </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200"/>
               </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase text-xs tracking-widest">Cancel</button>
              <button onClick={handleAddChit} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all uppercase text-xs tracking-widest">Create Group</button>
            </div>
          </div>
        </div>
      )}

      {/* Member Addition Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   <UserPlus className="text-emerald-500" />
                   {t('registerMember', language)}
                </h3>
                <button onClick={() => setShowMemberModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      Full Name
                   </label>
                   <input 
                      type="text" 
                      value={memberFormData.name} 
                      onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700" 
                      placeholder="Enter member's full name"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Phone size={12} /> Phone Number
                   </label>
                   <input 
                      type="text" 
                      value={memberFormData.phone} 
                      onChange={e => setMemberFormData({...memberFormData, phone: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700" 
                      placeholder="+91 XXXXX XXXXX"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CreditCard size={12} /> Aadhaar / ID Number
                   </label>
                   <input 
                      type="text" 
                      value={memberFormData.aadhaar} 
                      onChange={e => setMemberFormData({...memberFormData, aadhaar: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700" 
                      placeholder="1234 5678 9012"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin size={12} /> Address
                   </label>
                   <textarea 
                      value={memberFormData.address} 
                      onChange={e => setMemberFormData({...memberFormData, address: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 h-24" 
                      placeholder="Enter residential address"
                   />
                </div>
             </div>

             <div className="mt-8 flex gap-3">
               <button onClick={() => setShowMemberModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase text-xs tracking-widest">Cancel</button>
               <button 
                  onClick={handleAddMember}
                  disabled={!memberFormData.name || !memberFormData.phone}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
               >
                  Register Member
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Auction Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Gavel className="text-emerald-500" />
               {chits.find(c => c.id === showAuctionModal)?.currentMonth === chits.find(c => c.id === showAuctionModal)?.durationMonths 
                 ? 'Final Month Distribution' 
                 : `Run Month ${chits.find(c => c.id === showAuctionModal)?.currentMonth} Auction`
               }
            </h3>
            
            {chits.find(c => c.id === showAuctionModal)?.currentMonth === chits.find(c => c.id === showAuctionModal)?.durationMonths ? (
              <div className="py-6 text-slate-600">
                 <p className="font-bold mb-2">The final remaining member will receive the full prize amount.</p>
                 <p className="text-sm">No auction is required for the final month. All members pay the full monthly contribution.</p>
              </div>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-6 font-medium">Enter bidding details to calculate dividends.</p>
                <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('prizeAmount', language)} (₹)</label>
                      <input 
                        type="number" 
                        value={auctionData.bidAmount} 
                        onChange={e => setAuctionData({...auctionData, bidAmount: Number(e.target.value)})} 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xl font-black text-slate-900" 
                        placeholder="e.g. 450000"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 italic">Total Value: ₹{chits.find(c => c.id === showAuctionModal)?.totalValue.toLocaleString()}</p>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Winning Member</label>
                      <select 
                        value={auctionData.winningMemberId}
                        onChange={e => setAuctionData({...auctionData, winningMemberId: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white"
                      >
                        <option value="">Select Member</option>
                        {chits.find(c => c.id === showAuctionModal)?.members
                          .filter(m => !chits.find(c => c.id === showAuctionModal)?.auctions.some(a => a.winningMemberId === m.id))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                  </div>

                  {auctionData.bidAmount > 0 && (
                    <div className="p-4 bg-emerald-50 rounded-2xl space-y-2 border border-emerald-100">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase">{t('discountPool', language)}</span>
                          <span className="text-slate-900">₹{(chits.find(c => c.id === showAuctionModal)!.totalValue - auctionData.bidAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold border-b border-emerald-200 pb-2">
                          <span className="text-slate-500 uppercase">{t('foremanCommission', language)}</span>
                          <span className="text-slate-900">₹{((chits.find(c => c.id === showAuctionModal)!.totalValue * chits.find(c => c.id === showAuctionModal)!.commissionPercentage) / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black pt-1">
                          <span className="text-emerald-700 uppercase">{t('dividend', language)} / Member</span>
                          <span className="text-emerald-700">₹{(
                            calculateChitDividend(
                              auctionData.bidAmount, 
                              chits.find(c => c.id === showAuctionModal)!.totalValue,
                              chits.find(c => c.id === showAuctionModal)!.memberCount,
                              chits.find(c => c.id === showAuctionModal)!.commissionPercentage
                            ).dividendPerMember
                          ).toLocaleString()}</span>
                        </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowAuctionModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors uppercase text-xs tracking-widest">Cancel</button>
              <button 
                onClick={() => runAuction(showAuctionModal as string)} 
                disabled={chits.find(c => c.id === showAuctionModal)?.currentMonth !== chits.find(c => c.id === showAuctionModal)?.durationMonths && (!auctionData.winningMemberId || auctionData.bidAmount <= 0)}
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {t('confirmAuction', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">Member Payment Ledger</h3>
                   <p className="text-slate-500 text-sm">Group: {chits.find(c => c.id === showLedgerModal)?.name}</p>
                </div>
                <button onClick={() => setShowLedgerModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="py-4 px-4">Member</th>
                         <th className="py-4 px-4">Status</th>
                         <th className="py-4 px-4">Payments</th>
                         <th className="py-4 px-4">Action</th>
                      </tr>
                   </thead>
                   <tbody>
                      {(chits.find(c => c.id === showLedgerModal)?.members || []).map(member => {
                         const mp = (chits.find(c => c.id === showLedgerModal)?.payments || []).find(p => p.memberId === member.id);
                         const isWinner = (chits.find(c => c.id === showLedgerModal)?.auctions || []).some(a => a.winningMemberId === member.id);
                         const winMonth = (chits.find(c => c.id === showLedgerModal)?.auctions || []).find(a => a.winningMemberId === member.id)?.month;

                         return (
                            <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                               <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                        {(member.name || '?').charAt(0)}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-900">{member.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{member.phone}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-4 px-4">
                                  {isWinner ? (
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">Winner (M{winMonth})</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">Active Bidder</span>
                                  )}
                               </td>
                               <td className="py-4 px-4">
                                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                                     {(mp?.payments || []).map(p => (
                                        <div 
                                          key={p.month} 
                                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                          title={`Month ${p.month}: ₹${p.amount}`}
                                        >
                                          {p.month}
                                        </div>
                                     ))}
                                  </div>
                               </td>
                               <td className="py-4 px-4">
                                  {(mp?.payments || []).filter(p => p.status === 'pending').map(p => (
                                     <button 
                                       key={p.month}
                                       onClick={() => markPaymentPaid(showLedgerModal!, member.id, p.month)}
                                       className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-all mb-1"
                                     >
                                        <IndianRupee size={10} /> PAY M{p.month} (₹{p.amount})
                                     </button>
                                  ))}
                                  {mp && mp.payments.filter(p => p.status === 'paid').length === mp.payments.length && mp.payments.length > 0 && (
                                     <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase">
                                        <CheckCircle size={14} /> Fully Paid
                                     </div>
                                  )}
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
