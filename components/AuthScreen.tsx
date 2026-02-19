
import React, { useState, useMemo } from 'react';
import { User, FinanceMode, CURRENCIES } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  }, [passwordStrength]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 25) return 'bg-red-400';
    if (passwordStrength <= 50) return 'bg-orange-400';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }, [passwordStrength]);

  const validate = () => {
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
      setError('Username: 4-20 characters, letters, numbers, underscores only.');
      return false;
    }
    if (isRegistering) {
      if (passwordStrength < 100) {
        setError('Password must meet all complexity requirements.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    // Simulate network delay and backend validation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const savedUserStr = localStorage.getItem(`user_${username}`);
    
    if (isRegistering) {
      if (savedUserStr) {
        setError('Username already taken.');
        setIsLoading(false);
        return;
      }
      const newUser: User = { 
        username, 
        mode: FinanceMode.INDIVIDUAL, 
        transactions: [],
        currency: CURRENCIES[0], // Default to USD
        isRegistered: true 
      };
      localStorage.setItem(`user_${username}`, JSON.stringify(newUser));
      onAuthSuccess(newUser);
    } else {
      if (!savedUserStr) {
        setError('Invalid username or password.'); // Generic message for security
        setIsLoading(false);
        return;
      }
      const user = JSON.parse(savedUserStr);
      // Migration: Ensure user has currency
      if (!user.currency) user.currency = CURRENCIES[0];
      onAuthSuccess(user);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-[#E7E0D6] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#5D4037]"></div>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5D4037] text-white text-4xl font-black rounded-3xl mb-6 shadow-xl shadow-[#5D4037]/20">
            S
          </div>
          <h1 className="text-3xl font-extrabold text-[#5D4037]">Smart Spend AI</h1>
          <p className="text-[#8D6E63] mt-2 font-medium">Elevate your financial clarity.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#A1887F] uppercase tracking-widest mb-2 ml-1">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] focus:ring-4 focus:ring-[#8D6E63]/10 focus:border-[#8D6E63] outline-none transition-all font-medium text-[#5D4037]"
              placeholder="eg. smart_investor"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-[#A1887F] uppercase tracking-widest mb-2 ml-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] focus:ring-4 focus:ring-[#8D6E63]/10 focus:border-[#8D6E63] outline-none transition-all font-medium text-[#5D4037]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[2.4rem] text-[#A1887F] hover:text-[#5D4037] transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
            
            {isRegistering && password.length > 0 && (
              <div className="mt-3 px-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#A1887F] uppercase tracking-tighter">Security: {strengthLabel}</span>
                  <span className="text-[10px] font-bold text-[#A1887F]">{passwordStrength}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E7E0D6] rounded-full overflow-hidden">
                  <div className={`h-full ${strengthColor} transition-all duration-500`} style={{ width: `${passwordStrength}%` }}></div>
                </div>
                <ul className="mt-2 text-[10px] space-y-0.5 text-[#8D6E63] font-medium">
                  <li className={password.length >= 8 ? "text-emerald-600" : ""}>• Min 8 characters</li>
                  <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-emerald-600" : ""}>• Mix of case letters</li>
                  <li className={/[0-9]/.test(password) ? "text-emerald-600" : ""}>• Include numbers</li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : ""}>• Include special character</li>
                </ul>
              </div>
            )}
          </div>

          {isRegistering && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-[#A1887F] uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl bg-[#FAF7F2] border outline-none transition-all font-medium text-[#5D4037] ${confirmPassword && confirmPassword === password ? 'border-emerald-200 focus:ring-emerald-500/10' : 'border-[#E7E0D6] focus:ring-[#8D6E63]/10'}`}
                placeholder="••••••••"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-[10px] text-red-500 font-bold uppercase ml-1">Does not match</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (isRegistering && (passwordStrength < 100 || password !== confirmPassword))}
            className="w-full bg-[#5D4037] hover:bg-[#4E342E] disabled:bg-[#D7CCC8] disabled:cursor-not-allowed text-white font-extrabold py-5 rounded-[1.5rem] shadow-xl shadow-[#5D4037]/20 transition-all transform hover:-translate-y-1 active:translate-y-0.5 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-bold text-[#8D6E63] hover:text-[#5D4037] transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'New to Smart Spend? Create an Account'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#FAF7F2] flex justify-center gap-4 text-[10px] text-[#A1887F] font-bold uppercase tracking-widest">
          <span>Secure AES-256</span>
          <span>•</span>
          <span>Privacy Guaranteed</span>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
