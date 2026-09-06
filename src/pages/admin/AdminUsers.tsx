import React, { useState } from 'react';
import { UserCheck, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { AdminRole, AdminUser } from '../../types/database';
import { initialAdminUsers } from '../../data/seedData';
import { Modal } from '../../components/common/Modal';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('AUCTION ADMIN');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    const newUser: AdminUser = {
      id: 'admin_' + Date.now(),
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setUsers([...users, newUser]);
    setIsModalOpen(false);
    setEmail('');
    setFullName('');
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">ADMINISTRATOR ROLES & ACCESS</h1>
          <p className="text-xs text-slate-400">Manage role-based access control (RBAC) permissions for the tournament committee</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl">
          <span className="font-extrabold text-gbl-orange-400 uppercase block">SUPER ADMIN</span>
          <p className="text-slate-400 mt-1">Full control over settings, data reset, admin accounts, and auction overrides.</p>
        </div>
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl">
          <span className="font-extrabold text-sky-400 uppercase block">AUCTION ADMIN</span>
          <p className="text-slate-400 mt-1">Controls live bidding clock, marks sold/unsold, manages players and team budgets.</p>
        </div>
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl">
          <span className="font-extrabold text-amber-400 uppercase block">TOURNAMENT ADMIN</span>
          <p className="text-slate-400 mt-1">Enters match results, updates standings tables, and configures qualifiers.</p>
        </div>
        <div className="bg-gbl-navy-900 border border-gbl-navy-800 p-4 rounded-2xl">
          <span className="font-extrabold text-slate-300 uppercase block">VIEWER</span>
          <p className="text-slate-400 mt-1">Read-only monitoring access without permission to conduct live auction transactions.</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gbl-navy-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gbl-navy-800">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role Assigned</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gbl-navy-800 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gbl-navy-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">{u.full_name}</td>
                  <td className="p-4 font-mono text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      u.role === 'SUPER ADMIN' ? 'bg-gbl-orange-500/20 text-gbl-orange-400 border border-gbl-orange-500/30' :
                      u.role === 'AUCTION ADMIN' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                      u.role === 'TOURNAMENT ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-emerald-400 font-bold text-xs">Active</span>
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'SUPER ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADMIN USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ADD NEW ADMIN USER"
        subtitle="Provision access to tournament control functions"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="AUCTION ADMIN">AUCTION ADMIN</option>
              <option value="TOURNAMENT ADMIN">TOURNAMENT ADMIN</option>
              <option value="VIEWER">VIEWER</option>
              <option value="SUPER ADMIN">SUPER ADMIN</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider"
            >
              Add Admin
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
