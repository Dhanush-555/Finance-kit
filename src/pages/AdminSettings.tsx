import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Shield, User, Mail, ShieldCheck, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings: React.FC = () => {
  const { allProfiles, updateUserRole, isAdmin, user } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md">This area is reserved for system administrators only.</p>
      </div>
    );
  }

  const filteredUsers = allProfiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    if (userId === user.id) {
      toast.error("You cannot demote yourself!");
      return;
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Are you sure you want to make this user an ${newRole}?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await updateUserRole(userId, newRole as 'admin' | 'user');
        toast.success(`User role updated to ${newRole}`);
      } catch (err) {
        toast.error("Failed to update user role");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm">Control who has administrative access to the system.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        {profile.role === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{profile.full_name || 'Unnamed User'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{profile.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} />
                      <span className="text-xs font-medium">{profile.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${profile.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRoleToggle(profile.id, profile.role)}
                      disabled={profile.id === user.id}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                        profile.role === 'admin' 
                          ? 'text-red-600 bg-red-50 hover:bg-red-600 hover:text-white' 
                          : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
        <Shield className="text-amber-600 shrink-0" size={20} />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-bold">Important:</span> Adding an admin gives them full control over the database, including deleting history, running auctions, and managing other users. Only promote users you trust completely.
        </p>
      </div>
    </div>
  );
};
