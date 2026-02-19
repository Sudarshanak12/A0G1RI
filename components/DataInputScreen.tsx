
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
  
  const [smsText, setSmsText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isWebFetching, setIsWebFetching] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [cloudAlerts, setCloudAlerts] = useState<string[]>([]);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
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
      description: desc || `Expense: ${activeSubMode}`,
      date: date
    };

    onUpdateTransactions([...transactions, newTx]);
    setAmount('');
    setDesc('');
    addToast('success', 'Logged successfully.');
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
          const fallback = categories.find(c => 
            c.toLowerCase().includes((extracted.category || '').toLowerCase()) ||
            (extracted.category || '').toLowerCase().includes(c.toLowerCase())
          );
          if (fallback) setActiveSubMode(fallback);
        }
        
        if (extracted.date) setDate(extracted.date);
        
        setSmsText('');
        addToast('success', `AI Processed: ${currency.symbol}${extracted.amount}`);
        setTimeout(() => setShowSmartImport(false), 1200);
      } else {
        throw new Error("Missing data fields in AI response");
      }
    } catch (error: any) {
      console.error("AI Extraction Pipeline Error:", error);
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
        addToast('error', "API Quota limit reached. Please wait a few seconds.");
      } else if (msg.includes("api_key_missing")) {
        addToast('error', "API Key is missing! Check .env configuration.");
      } else {
        addToast('error', "AI extraction failed. Try a simpler text format.");
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFetchFromWeb = async () => {
    setIsWebFetching(true);
    addToast('info', "Attempting Cloud Web-Sync...");
    await new Promise(r => setTimeout(r, 2000));
    
    const mockWebFeeds = [
      `Internet Banking Alert: Transaction of INR 1,500.00 at Zomato. Date: ${new Date().toLocaleDateString()}. Status: Completed.`,
      `Web Portal Sync: Salary Credit from Employer Corp: INR 92,000.00. Reference: TXN-4421.`,
      `Online Notification: Refund received for cancelled order: INR 540.00. Available Bal: INR 1,24,000.`
    ];
    
    setCloudAlerts(mockWebFeeds);
    setIsWebFetching(false);
    addToast('success', "Found 3 cloud alerts!");
  };

  const handleRemoveTransaction = (id: string) => {
    onUpdateTransactions(transactions.filter(t => t.id !== id));
    addToast('info', 'Record removed.');
  };

  const runAnalysis = async () => {
    if (transactions.length === 0) {
      addToast('error', "The ledger is empty. Add data first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeFinances(user.mode, transactions);
      onAnalyze(result);
    } catch (error: any) {
      console.error("Analysis Failure:", error);
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
        addToast('error', "API limit exceeded. Please try again in 30 seconds.");
      } else {
        addToast('error', "AI Analysis Engine timed out. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredTransactions = transactions.filter(t => t.category === activeSubMode);
  const totalInSubMode = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-start py-4">
      {/* Visual Toast System */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 font-bold uppercase text-[10px] tracking-widest border pointer-events-auto ${
            t.type === 'success' ? 'bg-[#5D4037] text-white border-white/20' : t.type === 'error' ? 'bg-red-600 text-white border-red-400' : 'bg-white text-[#5D4037] border-[#E7E0D6]'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${t.type === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : t.type === 'error' ? 'bg-white' : 'bg-[#5D4037]'}`}></div>
            {t.text}
          </div>
        ))}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#E7E0D6] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#5D4037]"></div>
          <h2 className="text-2xl font-black text-[#5D4037] mb-8">Asset Portfolios</h2>
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

        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E7E0D6] shadow-xl relative group overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-xl shadow-inner transition-all group-hover:scale-110">📡</div>
                <div>
                  <h3 className="text-sm font-black text-[#5D4037] uppercase">Cloud Import</h3>
                  <p className="text-[10px] font-bold text-[#A1887F] uppercase tracking-tighter">Read from Web/SMS</p>
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
               <button 
                 onClick={handleFetchFromWeb}
                 disabled={isWebFetching || isExtracting}
                 className={`w-full py-4 border-2 border-dashed rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isWebFetching ? 'bg-[#FAF7F2] text-[#A1887F] border-[#D7CCC8]' : 'bg-white text-[#5D4037] border-[#E7E0D6] hover:bg-[#FAF7F2] hover:border-[#5D4037]'}`}
               >
                 {isWebFetching ? (
                   <div className="w-4 h-4 border-2 border-[#A1887F] border-t-transparent rounded-full animate-spin"></div>
                 ) : "Sync Cloud Web-Alerts"}
               </button>

               {cloudAlerts.length > 0 && (
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {cloudAlerts.map((alert, i) => (
                     <div 
                       key={i} 
                       onClick={() => handleSmartImport(alert)}
                       className="p-3 bg-[#FAF7F2] border border-[#E7E0D6] rounded-xl text-[9px] font-bold text-[#5D4037] cursor-pointer hover:border-[#5D4037] hover:bg-white transition-all animate-in slide-in-from-left-2"
                     >
                       {alert}
                       <span className="text-[8px] text-[#A1887F] uppercase mt-1 block font-black border-t border-[#E7E0D6] pt-1 mt-1">Extract This Now →</span>
                     </div>
                   ))}
                 </div>
               )}
               
               <div className="relative">
                 <textarea
                   value={smsText}
                   onChange={(e) => setSmsText(e.target.value)}
                   placeholder="Paste bank portal text or SMS alerts..."
                   className="w-full h-32 p-4 bg-[#FAF7F2] border border-[#E7E0D6] rounded-2xl text-xs font-bold text-[#5D4037] outline-none focus:ring-4 focus:ring-[#8D6E63]/5 transition-all resize-none placeholder:text-[#D7CCC8]"
                 />
                 {isExtracting && (
                   <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#5D4037] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-[#5D4037] uppercase tracking-widest">AI Extraction...</span>
                     </div>
                   </div>
                 )}
               </div>
               
               <button
                 disabled={isExtracting || !smsText.trim()}
                 onClick={() => handleSmartImport()}
                 className="w-full py-4 bg-[#5D4037] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
               >
                 Extract Manual Snippet
               </button>
             </div>
           )}
        </div>

        <button
          disabled={isAnalyzing}
          onClick={runAnalysis}
          className={`w-full py-8 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group ${
            isAnalyzing ? 'bg-[#D7CCC8] text-white cursor-wait' : 'bg-[#5D4037] text-white hover:scale-[1.02]'
          }`}
        >
          {isAnalyzing ? (
             <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : "Full AI Deep-Dive"}
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
              <span className="text-xs font-bold text-[#A1887F] uppercase block tracking-widest">Aggregate Total ({currency.code})</span>
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
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black text-[#A1887F] uppercase mb-2 ml-1">Merchant / Memo</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Details..."
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-[#A1887F] uppercase mb-2 ml-1">Posting Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-[#E7E0D6] rounded-2xl outline-none font-bold text-[#5D4037]"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleAddTransaction}
                className="w-full py-4 bg-[#5D4037] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#5D4037]/20 hover:-translate-y-1"
              >
                Log
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#A1887F] uppercase tracking-widest flex items-center gap-4">
               Current Ledger
               <div className="flex-1 h-px bg-[#FAF7F2]"></div>
            </h4>
            {filteredTransactions.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-[#FAF7F2] rounded-[3rem]">
                <div className="text-4xl opacity-20 mb-4">📓</div>
                <p className="text-[#A1887F] font-bold uppercase text-[10px] tracking-widest">No activity recorded for this asset.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.slice().reverse().map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 bg-[#FAF7F2] hover:bg-white rounded-[2rem] group transition-all border border-transparent hover:border-[#E7E0D6] hover:shadow-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#5D4037] font-black border border-[#E7E0D6] group-hover:bg-[#5D4037] group-hover:text-white transition-colors">
                        {currency.symbol}
                      </div>
                      <div>
                        <p className="text-lg font-black text-[#5D4037] leading-tight">{tx.description}</p>
                        <p className="text-[10px] font-black text-[#A1887F] uppercase tracking-tighter">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-2xl font-black text-[#5D4037] tracking-tighter">{formatLargeValue(tx.amount, currency)}</span>
                      <button onClick={() => handleRemoveTransaction(tx.id)} className="text-[#D7CCC8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-50 rounded-2xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInputScreen;
