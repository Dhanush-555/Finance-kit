import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { t } from '../i18n/i18n';
import { Download, Filter, FileText, Table, CheckCircle, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const History: React.FC = () => {
  const { language, transactions, setTransactions, isAdmin } = useFinance();

  // Combine derived history with manual transactions
  const historyData = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction record? This action cannot be undone.')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("FinanceKit Transaction History", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Person/Entity', 'Type', 'Amount', 'Status']],
      body: historyData.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.person || 'System',
        h.type.replace(/_/g, ' ').toUpperCase(),
        `Rs. ${h.amount.toLocaleString()}`,
        'SUCCESS'
      ]),
    });
    doc.save("FinanceKit_History.pdf");
  };

  const exportCSV = () => {
    const headers = ['Date', 'Person', 'Type', 'Amount', 'Status'];
    const rows = historyData.map(h => [
      new Date(h.date).toLocaleDateString(),
      h.person || 'System',
      h.type,
      h.amount,
      'SUCCESS'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinanceKit_History.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleClearAll = () => {
    if (window.confirm('WARNING: You are about to delete ALL transaction records. This cannot be undone. Are you sure?')) {
      if (window.confirm('Final Confirmation: Delete EVERYTHING in the history?')) {
        setTransactions([]);
      }
    }
  };

  const getTypeStyles = (type: string) => {
    if (type.includes('received') || type.includes('dividend')) return 'bg-emerald-50 text-emerald-600';
    if (type.includes('commission')) return 'bg-blue-50 text-blue-600';
    if (type.includes('paid') || type.includes('penalty')) return 'bg-orange-50 text-orange-600';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('history', language)}</h2>
          <p className="text-slate-500 text-sm">Comprehensive ledger of all financial movements</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           {isAdmin && (
             <button 
               onClick={handleClearAll}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100"
             >
               <Trash2 size={18} /> CLEAR ALL
             </button>
           )}
           <button 
             onClick={exportCSV}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
           >
             <Table size={18} /> CSV
           </button>
           <button 
             onClick={exportPDF}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
           >
             <Download size={18} /> PDF
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-2 text-slate-400">
             <Filter size={18} />
             <span className="text-xs font-black uppercase tracking-widest">Transaction Ledger</span>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase">{historyData.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historyData.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{h.person || 'SYSTEM'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getTypeStyles(h.type)}`}>
                      {h.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">₹{h.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
                       <CheckCircle size={14} /> Success
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(h.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {historyData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                     <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                     <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Zero transactions recorded</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

