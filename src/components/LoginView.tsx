import React, { useState } from 'react';
import { Lock, Mail, AlertTriangle, Key } from 'lucide-react';

interface LoginViewProps {
  onLogin: (session: any) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }
      
      setResetMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-slate-800 p-6 text-center">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Wash Hub POS</h1>
          <p className="text-slate-400 text-sm mt-1">Multi-Tenant Laundry Management</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {resetMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <Key className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    placeholder="superadmin@washhub.com"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-xs font-medium text-cyan-600 hover:text-cyan-500"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    placeholder="Enter your email"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  We'll send you an email with a link to reset your password.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full flex justify-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
