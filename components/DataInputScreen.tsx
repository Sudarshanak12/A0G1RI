
import React, { useState, useEffect } from 'react';
import { User, Transaction, MODE_CONFIG, FinanceMode, Currency } from '../types';
import { analyzeFinances, extractTransactionFromText } from '../services/geminiService';

interface DataInputScreenProps {
  user: User;
  onUpdateTransactions: (transactions: Transaction[]) => void;
  onAnalyze: (result: any) => void;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

const formatLargeValue = (val: number, currency: Currency) => {
  const symbol = currency.symbol;
  const code = currency.code;
  const locale = code === 'INR' ? 'en-IN' : 'en-US';

  if (code === 'INR') {
    if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${symbol}${(val / 100000).toFixed(2)} L`;
  } else {
    if (val >= 1000000000000) return `${symbol}${(val / 1000000000000).toFixed(2)}T`;
    if (val >= 1000000000) return `${symbol}${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(2)}M`;
  }
  
  return `${symbol}${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DataInputScreen: React.FC<DataInputScreenProps> = ({ user, onUpdateTransactions, onAnalyze }) => {
  const [activeSubMode, setActiveSubMode] = useState(MODE_CONFIG[user.mode][0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // SMS/Web Fetcher States
  const [smsText, setSmsText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isWebFetching, setIsWebFetching] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  
  // Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const categories = MODE_CONFIG[user.mode];
  const transactions = user.transactions || [];
  const currency = user.currency;

  const handleAddTransaction = () => {
    if (!amount || isNaN(Number(amount))) {
      addToast('error', 'Please enter a valid numeric amount.');
      return;
    }
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      category: activeSubMode,
      amount: parseFloat(amount),
      description: desc || `Expense for ${activeSubMode}`,
      date: date
    };

    onUpdateTransactions([...transactions, newTx]);
    setAmount('');
    setDesc('');
    addToast('success', 'Transaction logged successfully.');
  };

  const handleSmartImport = async (textToProcess: string = smsText) => {
    const text = textToProcess.trim();
    if (!text) return;

    setIsExtracting(true);
    try {
      const extracted = await extractTransactionFromText(text, user.mode, categories);
      
      if (extracted && extracted.amount !== undefined) {
        setAmount(extracted.amount.toString());
        setDesc(extracted.description || '');
        
        if (extracted.category && categories.includes(extracted.category)) {
          setActiveSubMode(extracted.category);
        } else {
          const fallbackCat = categories.find(c => c.toLowerCase().includes((extracted.category || '').toLowerCase()));
          if (fallbackCat) setActiveSubMode(fallbackCat);
        }
        
        if (extracted.date) setDate(extracted.date);
        
        setSmsText('');
        addToast('success', `AI identified: ${currency.symbol}${extracted.amount}`);
        setTimeout(() => setShowSmartImport(false), 1000);
      } else {
        throw new Error("Missing data in extraction");
      }
    } catch (error) {
      console.error("Extraction Failure:", error);
      addToast('error', "AI couldn't parse that. Try pasting a cleaner version of the SMS.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Simulates "Reading from the web" via a cloud service or online SMS portal
  const handleFetchFromWeb = async () => {
    setIsWebFetching(true);
    addToast('info', "Connecting to Web SMS Receiver...");
    
    // Simulate web latency
    await new Promise(r => setTimeout(r, 1500));
    
    const mockWebSms = `Dear Customer, your A/C XXXXXX5432 has been credited with INR 18,000 on ${new Date().toLocaleDateString()}. Available Bal: INR 25,000. Ref: XXX410XX.`;
    setSmsText(mockWebSms);
    setIsWebFetching(false);
    
    addToast('success', "Latest Web-Alert Fetched!");
    handleSmartImport(mockWebSms);
  };

  const handleRemoveTransaction = (id: string) => {
    onUpdateTransactions(transactions.filter(t => t.id !== id));
    addToast('info', 'Transaction removed.');
  };

  const runAnalysis = async () => {
    if (transactions.length === 0) {
      addToast('error', "Dataset is empty. Add records first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeFinances(user.mode, transactions);
      onAnalyze(result);
    } catch (error) {
      console.error(error);
      addToast('error', "Deep analysis failed. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredTransactions = transactions.filter(t => t.category === activeSubMode);
  const totalInSubMode = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-start py-4">
      {/* Toast Portal */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 font-bold uppercase text-[10px] tracking-widest border border-white/20 pointer-events-auto ${
            t.type === 'success' ? 'bg-[#5D4037] text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#D7CCC8] text-[#5D4037]'
          }`}>
            <span className="text-base">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}</span>
            {t.text}
          </div>
        ))}
      </div>

      <div className="lg:col-span-4 space-y-6">
        {/* Category Selector */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#E7E0D6] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#5D4037]"></div>
          <h2 className="text-2xl font-black text-[#5D4037] mb-8">Management</h2>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveSubMode(cat)}
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex justify-between items-center group ${
                  activeSubMode === cat 
                    ? 'bg-[#5D4037] text-white shadow-xl shadow-[#5D4037]/20 font-bold' 
                    : 'hover:bg-[#FAF7F2] text-[#8D6E63] font-medium'
                }`}
              >
                <span>{cat}</span>
                {transactions.some(t => t.category === cat) && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeSubMode === cat ? 'bg-white text-[#5D4037]' : 'bg-[#D7CCC8] text-white'}`}>
                    {transactions.filter(t => t.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Import Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E7E0D6] shadow-xl relative group overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:rotate-12 transition-transform">🪄</div>
                <div>
                  <h3 className="text-sm font-black text-[#5D4037] uppercase">Smart Import</h3>
                  <p className="text-[10px] font-bold text-[#A1887F] uppercase tracking-tighter">AI Extraction Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSmartImport(!showSmartImport)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showSmartImport ? 'bg-[#5D4037] text-white rotate-45' : 'bg-[#FAF7F2] text-[#5D4037]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
           </div>

           {showSmartImport && (
             <div className="space-y-4 animate-in fade-in zoom-in duration-300">
               <div className="flex gap-2">
                 <button 
                   onClick={handleFetchFromWeb}
                   disabled={isWebFetching || isExtracting}
                   className="flex-1 py-3 bg-[#FAF7F2] border border-[#E7E0D6] rounded-xl text-[10px] font-black uppercase text-[#5D4037] flex items-center justify-center gap-2 hover:bg-[#E7E0D6] transition-all disabled:opacity-50"
                 >
                   {isWebFetching ? "Connecting..." : "☁ Read From Web"}
                 </button>
               </div>
               
               <div className="relative">
                 <textarea
                   value={smsText}
                   onChange={(e) => setSmsText(e.target.value)}
                   placeholder="Paste any bank SMS or notification text..."
                   className="w-full h-32 p-4 bg-[#FAF7F2] border border-[#E7E0D6] rounded-2xl text-xs font-bold text-[#5D4037] outline-none focus:ring-4 focus:ring-[#8D6E63]/5 transition-all resize-none placeholder:text-[#D7CCC8]"
                 />
                 {isExtracting && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                     <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-[#5D4037]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-[10px] font-black text-[#5D4037] uppercase">Reading...</span>
                     </div>
                   </div>
                 )}
               </div>
               
               <button
                 disabled={isExtracting || !smsText.trim()}
                 onClick={() => handleSmartImport()}
                 className="w-full py-4 bg-[#5D4037] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
               >
                 Process Alert
               </button>
             </div>
           )}
        </div>

        <button
          disabled={isAnalyzing}
          onClick={runAnalysis}
          className={`w-full py-8 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group ${
            isAnalyzing
              ? 'bg-[#D7CCC8] text-white cursor-wait'
              : 'bg-[#5D4037] hover:bg-[#4E342E] text-white hover:scale-[1.02]'
          }`}
        >
          {isAnalyzing ? (
             <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <>
              <span className="bg-white/10 p-2 rounded-xl group-hover:rotate-12 transition-transform">✨</span>
              Deep Analysis
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#E7E0D6]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-black text-[#A1887F] uppercase tracking-[0.2em]">{user.mode} Sector</span>
              <h3 className="text-4xl font-black text-[#5D4037] mt-1">{activeSubMode}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#A1887F] uppercase block tracking-widest">Running Total ({currency.code})</span>
              <span className="text-5xl font-black text-[#5D4037] tracking-tight">{formatLargeValue(totalInSubMode, currency)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-10 p-6 bg-[#FAF7F2] rounded-3xl border border-[#E7E0D6]">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-[#A1887F] uppercase mb-2 ml-1">Amount ({currency.symbol})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl focus:ring-4 focus:ring-[#8D6E63]/10 outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black text-[#A1887F] uppercase mb-2 ml-1">Description</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Details..."
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl focus:ring-4 focus:ring-[#8D6E63]/10 outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-[#A1887F] uppercase mb-2 ml-1">Log Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl focus:ring-4 focus:ring-[#8D6E63]/10 outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleAddTransaction}
                className="w-full py-4 bg-[#5D4037] hover:bg-[#4E342E] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#5D4037]/10"
              >
                Log
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#A1887F] uppercase flex items-center gap-4 tracking-widest">
              Transaction History
              <div className="flex-1 h-px bg-[#FAF7F2]"></div>
            </h4>
            {filteredTransactions.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-[#FAF7F2] rounded-[2rem]">
                <div className="text-4xl opacity-20 mb-4 text-[#D7CCC8]">📥</div>
                <p className="text-[#A1887F] font-bold uppercase text-[10px] tracking-[0.3em]">Vault currently empty for this sector.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.slice().reverse().map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 bg-[#FAF7F2] hover:bg-white rounded-[2rem] group transition-all border border-transparent hover:border-[#E7E0D6] hover:shadow-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#5D4037] font-black text-xl border border-[#E7E0D6] shadow-sm group-hover:bg-[#5D4037] group-hover:text-white transition-colors">
                        {currency.symbol}
                      </div>
                      <div>
                        <p className="text-lg font-black text-[#5D4037] leading-tight">{tx.description}</p>
                        <p className="text-[10px] font-black text-[#A1887F] uppercase tracking-[0.1em]">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-2xl font-black text-[#5D4037] tracking-tighter">{formatLargeValue(tx.amount, currency)}</span>
                      <button
                        onClick={() => handleRemoveTransaction(tx.id)}
                        className="text-[#D7CCC8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-50 rounded-2xl"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#5D4037] p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-[0_35px_70px_-15px_rgba(93,64,55,0.4)] border border-white/5">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D7CCC8] mb-4">Aggregate Logs</p>
            <p className="text-6xl font-black tracking-tighter">{transactions.length}</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D7CCC8] mb-4">Global Total ({currency.code})</p>
            <p className="text-6xl font-black tracking-tighter">{formatLargeValue(transactions.reduce((a, b) => a + b.amount, 0), currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInputScreen;
