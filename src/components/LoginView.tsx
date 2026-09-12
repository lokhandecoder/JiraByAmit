import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { CheckSquare, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useJira();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@personaljira.io');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(emailOrUsername, password);
      if (!res.success) {
        setErrorMsg(res.message);
      }
      setLoading(false);
    }, 150);
  };

  const handleFillAdmin = () => {
    setEmailOrUsername('admin@personaljira.io');
    setPassword('12345678');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-sm w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto mb-2">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Personal Jira
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-login-email"
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  placeholder="admin or email@domain.com"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="12345678"
                  className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick autofill helper */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Admin: <strong className="text-slate-700 dark:text-slate-300">12345678</strong></span>
            <button
              type="button"
              id="btn-autofill-admin"
              onClick={handleFillAdmin}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Fill Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
