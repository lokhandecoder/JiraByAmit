import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { UserRole } from '../types';
import { 
  UserPlus, 
  X, 
  Key, 
  ShieldCheck 
} from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  developer: 'Developer',
  qa: 'QA Engineer',
  product_owner: 'Product Owner',
};

const rolePills: Record<UserRole, string> = {
  admin: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  developer: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  qa: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  product_owner: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

export const UsersView: React.FC = () => {
  const { users, currentUser, createUser } = useJira();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [password, setPassword] = useState('12345678');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const result = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      password: password.trim() || '12345678',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setName('');
      setEmail('');
      setPassword('12345678');
      setRole('developer');
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
      }, 1000);
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Team Members
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer user accounts, credentials, and role permissions.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-open-create-user"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
        {users.map(user => (
          <div
            key={user.id}
            id={`user-row-${user.id}`}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center space-x-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" title="Administrator" />
                  )}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {/* Password indicator */}
              <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Key className="w-3 h-3 text-amber-500" />
                <span>{user.password || '12345678'}</span>
              </div>

              {/* Role pill */}
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${rolePills[user.role]}`}>
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Add Team Member
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div className={`p-2 rounded text-xs ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@personaljira.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="developer">Developer</option>
                  <option value="qa">QA Engineer</option>
                  <option value="product_owner">Product Owner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
