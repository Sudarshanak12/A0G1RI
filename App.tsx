
import React, { useState, useEffect, useCallback } from 'react';
import { FinanceMode, User, Transaction, MODE_CONFIG, AnalysisResult, CURRENCIES, Currency } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import DemoDataScreen from './components/DemoDataScreen';
import DashboardScreen from './components/DashboardScreen';
import AuthScreen from './components/AuthScreen';
import DataInputScreen from './components/DataInputScreen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'welcome' | 'demo' | 'input' | 'dashboard'>('auth');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isConverting, setIsConverting] = useState(false);

  // Fetch real-time exchange rates relative to USD
  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates) {
        setRates(data.rates);
      }
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh rates every 10 minutes
    const interval = setInterval(fetchRates, 600000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('welcome');
  };

  const handleUpdateMode = (mode: FinanceMode) => {
    if (currentUser) {
      const updated = { ...currentUser, mode };
      setCurrentUser(updated);
      localStorage.setItem(`user_${updated.username}`, JSON.stringify(updated));
      setCurrentScreen('demo');
    }
  };

  const handleUpdateCurrency = async (newCurrency: Currency) => {
    if (!currentUser || !rates[newCurrency.code] || !rates[currentUser.currency.code]) return;
    
    setIsConverting(true);
    // Real-time conversion logic
    const oldRate = rates[currentUser.currency.code];
    const newRate = rates[newCurrency.code];
    const conversionFactor = newRate / oldRate;

    const convertedTransactions = currentUser.transactions.map(tx => ({
      ...tx,
      amount: tx.amount * conversionFactor
    }));

    const updated: User = { 
      ...currentUser, 
      currency: newCurrency, 
      transactions: convertedTransactions 
    };

    setCurrentUser(updated);
    localStorage.setItem(`user_${updated.username}`, JSON.stringify(updated));
    
    // If an analysis was present, it's technically stale now because the currency changed,
    // but we can just clear it to force a re-analysis in the new currency if needed.
    setAnalysis(null);
    if (currentScreen === 'dashboard') setCurrentScreen('input');
    
    setTimeout(() => setIsConverting(false), 500);
  };

  const handleUpdateTransactions = (transactions: Transaction[]) => {
    if (currentUser) {
      const updated = { ...currentUser, transactions };
      setCurrentUser(updated);
      localStorage.setItem(`user_${updated.username}`, JSON.stringify(updated));
    }
  };

  const handleStartAnalysis = (analysisResult: AnalysisResult) => {
    setAnalysis(analysisResult);
    setCurrentScreen('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentScreen('auth');
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#5D4037]">
      {currentUser && (
        <nav className="bg-white/80 backdrop-blur-md border-b border-[#E7E0D6] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentScreen('welcome')}>
            <div className="w-10 h-10 bg-[#5D4037] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <span className="text-xl font-extrabold tracking-tight text-[#5D4037]">SmartSpend <span className="text-[#8D6E63] font-medium">AI</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1 bg-[#FAF7F2] rounded-lg border border-[#E7E0D6] transition-opacity ${isConverting ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-[10px] font-black text-[#A1887F] uppercase">Currency</span>
              <select 
                disabled={isConverting}
                value={currentUser.currency.code}
                onChange={(e) => {
                  const selected = CURRENCIES.find(c => c.code === e.target.value);
                  if (selected) handleUpdateCurrency(selected);
                }}
                className="bg-transparent text-sm font-bold text-[#5D4037] outline-none cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
              {isConverting && (
                <div className="w-3 h-3 border-2 border-[#5D4037] border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="hidden md:flex flex-col items-end border-l border-[#E7E0D6] pl-6">
              <span className="text-xs font-bold text-[#A1887F] uppercase tracking-widest">Active User</span>
              <span className="text-sm font-bold text-[#5D4037]">{currentUser.username}</span>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 text-sm font-bold border-2 border-[#E7E0D6] text-[#8D6E63] rounded-xl hover:bg-[#FAF7F2] hover:text-[#5D4037] transition-all"
            >
              Sign Out
            </button>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentScreen === 'auth' && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
        {currentScreen === 'welcome' && currentUser && (
          <WelcomeScreen onSelectMode={handleUpdateMode} />
        )}
        {currentScreen === 'demo' && currentUser && (
          <DemoDataScreen 
            mode={currentUser.mode} 
            currency={currentUser.currency}
            onNext={() => setCurrentScreen('input')} 
          />
        )}
        {currentScreen === 'input' && currentUser && (
          <DataInputScreen 
            user={currentUser} 
            onUpdateTransactions={handleUpdateTransactions}
            onAnalyze={handleStartAnalysis}
          />
        )}
        {currentScreen === 'dashboard' && currentUser && analysis && (
          <DashboardScreen 
            analysis={analysis} 
            mode={currentUser.mode}
            currency={currentUser.currency}
            onBack={() => setCurrentScreen('input')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
