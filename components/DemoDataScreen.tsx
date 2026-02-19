
import React from 'react';
import { FinanceMode, MODE_CONFIG, Currency } from '../types';

interface DemoDataScreenProps {
  mode: FinanceMode;
  currency: Currency;
  onNext: (useDemo: boolean) => void;
}

const DemoDataScreen: React.FC<DemoDataScreenProps> = ({ mode, currency, onNext }) => {
  const getDemoTable = () => {
    const categories = MODE_CONFIG[mode];
    return [
      { id: '1', category: categories[0], amount: 450, date: '2024-03-01', note: 'Monthly payment' },
      { id: '2', category: categories[1], amount: 120, date: '2024-03-05', note: 'Utility bill' },
      { id: '3', category: categories[2] || categories[0], amount: 85, date: '2024-03-10', note: 'Misc expense' },
    ];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#efebe9]">
        <h2 className="text-3xl font-bold text-[#5d4037] mb-6">Demo Dataset: {mode}</h2>
        <p className="text-[#8d6e63] mb-8">
          Below is an example of how your data will be structured for the <span className="font-semibold">{mode}</span> mode. 
          You can add your own data in the next step to get a personalized AI analysis.
        </p>

        <div className="overflow-hidden rounded-2xl border border-[#d7ccc8] mb-10">
          <table className="w-full text-left">
            <thead className="bg-[#fdfaf5]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#a1887f] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1887f] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1887f] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1887f] uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efebe9]">
              {getDemoTable().map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 text-sm font-medium text-[#5d4037]">{row.category}</td>
                  <td className="px-6 py-4 text-sm text-[#5d4037] font-mono">{currency.symbol}{row.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-[#8d6e63]">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-[#a1887f] italic">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => onNext(false)}
            className="flex-1 bg-[#5d4037] hover:bg-[#4e342e] text-white font-bold py-4 rounded-xl shadow-lg transition-all"
          >
            Build My Own Dataset
          </button>
          <button
            onClick={() => onNext(true)}
            className="flex-1 bg-[#f5f5dc] border-2 border-[#d7ccc8] text-[#5d4037] font-bold py-4 rounded-xl hover:bg-[#efebe9] transition-all"
          >
            Start with Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoDataScreen;
