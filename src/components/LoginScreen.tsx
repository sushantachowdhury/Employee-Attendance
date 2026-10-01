import React, { useState } from 'react';
import { Fingerprint, IdCard, Lock, Eye, EyeOff, KeyRound, Check, Phone } from 'lucide-react';
import { AuthUser } from '../types/attendance';
import { safeFetchJson, getLocalCachedEmployees } from '../utils/api';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginInput, setLoginInput] = useState('EMP001');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setError('Please enter Employee ID or Registered Phone Number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await safeFetchJson<{ success: boolean; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginInput.trim(), password }),
      });

      if (result.ok && result.data?.user) {
        onLoginSuccess(result.data.user);
        return;
      }

      // Check if backend returned a specific authentication error (e.g. inactive account)
      if (result.error && !result.error.includes('Server error') && !result.error.includes('Network') && !result.error.includes('timed out')) {
        throw new Error(result.error);
      }

      // Offline / Local fallback login using cached employee roster
      const cached = getLocalCachedEmployees();
      const cleanIdent = loginInput.trim().toLowerCase().replace(/[\s\-\+\(\)]/g, '');
      const match = cached.find((e) => {
        const eId = e.empId.toLowerCase();
        const ePhone = (e.phone || '').toLowerCase().replace(/[\s\-\+\(\)]/g, '');
        return (
          eId === cleanIdent ||
          (ePhone.length > 5 && (ePhone.endsWith(cleanIdent) || cleanIdent.endsWith(ePhone)))
        );
      });

      if (match) {
        if (match.status === 'inactive') {
          throw new Error('Your account is currently INACTIVE. Contact your administrator.');
        }
        const expectedPwd = match.role === 'admin' ? 'admin' : 'password123';
        if (password === expectedPwd) {
          onLoginSuccess({
            empId: match.empId,
            name: match.name,
            department: match.department,
            office: match.office,
            role: match.role || 'employee',
            status: match.status,
            phone: match.phone,
            email: match.email,
            token: `local_token_${match.empId}_${Date.now()}`,
          });
          return;
        } else {
          throw new Error('Invalid password. Please check your credentials.');
        }
      }

      throw new Error(result.error || 'Login failed. Please check your credentials.');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (id: string, phonePreset?: string) => {
    setLoginInput(phonePreset || id);
    setPassword(id === 'ADMIN01' ? 'admin' : 'password123');
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 px-1">
      {/* Top Branding Section matching Document 1 - Screen 1 */}
      <div className="text-center mt-6 mb-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center shadow-sm">
          <Fingerprint className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-semibold text-white mt-3 mb-0.5 tracking-tight">
          Staff attendance
        </h1>
        <p className="text-xs text-neutral-400">Sign in with Employee ID or Mobile Number</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-3.5 my-auto">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs text-center animate-shake">
            {error}
          </div>
        )}

        {/* Employee ID or Phone Number Field */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1 ml-1">
            Employee ID or Phone Number
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-neutral-400">
              {loginInput.startsWith('+') || /^\d+$/.test(loginInput.replace(/\s+/g, '')) ? (
                <Phone className="w-4 h-4 text-emerald-400" />
              ) : (
                <IdCard className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. EMP001 or +91 98301 23456"
              required
              className="w-full bg-neutral-800/90 border border-neutral-700/80 focus:border-blue-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1 ml-1">
            Password
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-neutral-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-neutral-800/90 border border-neutral-700/80 focus:border-blue-500 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-neutral-400 hover:text-neutral-200 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Log in Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#185FA5] hover:bg-[#154f8a] text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-900/30 text-sm transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Log in'
          )}
        </button>

        {/* Forgot password */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 transition font-normal"
          >
            Forgot password?
          </button>
        </div>

        {/* Quick Demo Selector Chips */}
        <div className="pt-3 border-t border-neutral-800">
          <p className="text-[11px] text-neutral-400 text-center mb-1.5 font-medium">
            Demo quick login (ID or Phone):
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => selectPreset('EMP001', '+91 98301 23456')}
              className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center justify-between ${
                loginInput === 'EMP001' || loginInput === '+91 98301 23456'
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <strong className="block text-white text-[11px]">Amit Das (IT)</strong>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> +91 98301 23456
                </span>
              </div>
              {(loginInput === 'EMP001' || loginInput === '+91 98301 23456') && (
                <Check className="w-3 h-3 text-blue-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => selectPreset('EMP002', '+91 98312 34567')}
              className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center justify-between ${
                loginInput === 'EMP002' || loginInput === '+91 98312 34567'
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <strong className="block text-white text-[11px]">Riya Sen (HR)</strong>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> +91 98312 34567
                </span>
              </div>
              {(loginInput === 'EMP002' || loginInput === '+91 98312 34567') && (
                <Check className="w-3 h-3 text-blue-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => selectPreset('EMP003', '+91 98323 45678')}
              className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center justify-between ${
                loginInput === 'EMP003' || loginInput === '+91 98323 45678'
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <strong className="block text-white text-[11px]">Sourav (Accounts)</strong>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> +91 98323 45678
                </span>
              </div>
              {(loginInput === 'EMP003' || loginInput === '+91 98323 45678') && (
                <Check className="w-3 h-3 text-blue-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => selectPreset('EMP004', '+91 98334 56789')}
              className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center justify-between ${
                loginInput === 'EMP004' || loginInput === '+91 98334 56789'
                  ? 'border-red-500 bg-red-950/40 text-red-300'
                  : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <strong className="block text-neutral-300 text-[11px] flex items-center gap-1">
                  Priya Sharma
                  <span className="text-[9px] px-1 bg-red-950 text-red-400 rounded border border-red-800">Inactive</span>
                </strong>
                <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> +91 98334 56789
                </span>
              </div>
              {(loginInput === 'EMP004' || loginInput === '+91 98334 56789') && (
                <Check className="w-3 h-3 text-red-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => selectPreset('ADMIN01', '+91 98000 11223')}
              className={`col-span-2 px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center justify-between ${
                loginInput === 'ADMIN01' || loginInput === '+91 98000 11223'
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <strong className="block text-white text-[11px]">ADMIN01 (Supervisor / HR)</strong>
                <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> +91 98000 11223
                </span>
              </div>
              {(loginInput === 'ADMIN01' || loginInput === '+91 98000 11223') && (
                <Check className="w-3 h-3 text-blue-400" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-neutral-900 border border-neutral-700 rounded-2xl p-5 shadow-2xl text-center">
            <KeyRound className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">Reset Password</h3>
            {forgotSubmitted ? (
              <div className="text-xs text-green-400 my-3">
                Reset instructions sent for Employee ID or Mobile <strong>{loginInput}</strong>.
              </div>
            ) : (
              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                Contact your HR Department or verify your employee profile with supervisor to reset login.
              </p>
            )}
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSubmitted(false);
              }}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
