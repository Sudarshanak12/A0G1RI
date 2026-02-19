
import React from 'react';
import { FinanceMode, MODE_CONFIG } from '../types';

interface WelcomeScreenProps {
  onSelectMode: (mode: FinanceMode) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectMode }) => {
  const modes = [
    { 
      id: FinanceMode.INDIVIDUAL, 
      icon: '👤', 
      title: 'Individual', 
      desc: 'Smart tracking for lifestyle, food, and long-term investments.',
      accent: '#8D6E63' 
    },
    { 
      id: FinanceMode.BUSINESS, 
      icon: '💼', 
      title: 'Business', 
      desc: 'Professional management for operations, payroll, and tax.',
      accent: '#5D4037'
    },
    { 
      id: FinanceMode.FAMILY, 
      icon: '🏠', 
      title: 'Family', 
      desc: 'Household budgeting for education, health, and utilities.',
      accent: '#A1887F'
    },
    { 
      id: FinanceMode.TRIP, 
      icon: '✈️', 
      title: 'Trip/Travel', 
      desc: 'Comprehensive travel expense monitoring and logistics.',
      accent: '#D7CCC8'
    }
  ];

  return (
    <div className="space-y-12 py-6 animate-in fade-in duration-1000">
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black text-[#5D4037] tracking-tight">Welcome to Smart Spend <span className="text-[#8D6E63]">AI</span></h1>
        <p className="text-lg text-[#8D6E63] font-medium leading-relaxed">
          Select a financial profile to begin your deep-dive analysis. Our AI detects patterns, spots anomalies, and optimizes your wealth.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {modes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="group brown-card p-10 rounded-[3rem] cursor-pointer relative overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#E7E0D6] group-hover:bg-[#5D4037] transition-all"></div>
            
            <div className="text-6xl mb-8 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
              {mode.icon}
            </div>
            
            <h3 className="text-2xl font-black text-[#5D4037] mb-4">{mode.title}</h3>
            <p className="text-[#8D6E63] text-sm font-medium leading-relaxed mb-8">{mode.desc}</p>
            
            <div className="mt-auto space-y-3 w-full">
              <div className="flex flex-wrap justify-center gap-1.5">
                {MODE_CONFIG[mode.id].slice(0, 3).map((sub) => (
                  <span key={sub} className="px-3 py-1 bg-[#FAF7F2] rounded-full text-[9px] font-bold text-[#5D4037] uppercase tracking-wider">
                    {sub}
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-black text-[#A1887F] uppercase tracking-widest pt-4 group-hover:text-[#5D4037] transition-colors">
                Initialize Mode →
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
