
import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, 
  LineChart, Line, CartesianGrid, Sector, Brush, AreaChart, Area 
} from 'recharts';
import { AnalysisResult, FinanceMode, Currency } from '../types';

interface DashboardScreenProps {
  analysis: AnalysisResult;
  mode: FinanceMode;
  currency: Currency;
  onBack: () => void;
}

const COLORS = ['#5D4037', '#8D6E63', '#A1887F', '#D7CCC8', '#E7E0D6', '#BCAAA4'];

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

const renderActiveShape = (props: any, currency: Currency) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill="#5D4037" className="text-sm font-black uppercase tracking-tighter">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#8D6E63" className="text-xs font-bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#5D4037" className="text-[10px] font-black uppercase">
        {formatLargeValue(value, currency)}
      </text>
    </g>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ analysis, mode, currency, onBack }) => {
  const [activePieIndex, setActivePieIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-[#5D4037]';
    if (score >= 50) return 'text-[#8D6E63]';
    return 'text-red-700';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-100';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const circumference = 440;

  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black text-[#A1887F] uppercase tracking-[0.3em]">Analysis Completed</span>
          <h1 className="text-4xl font-black text-[#5D4037] mt-1">Smart Insights Dashboard</h1>
          <p className="text-[#8D6E63] font-medium uppercase text-[10px] tracking-widest mt-1">Profile: {mode} Engine Active ({currency.code})</p>
        </div>
        <button
          onClick={onBack}
          className="px-10 py-4 bg-white border-2 border-[#E7E0D6] rounded-[1.5rem] text-[#5D4037] font-black hover:border-[#5D4037] transition-all shadow-lg active:scale-95"
        >
          Modify Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Efficiency Rating */}
        <div className="md:col-span-4 bg-white p-10 rounded-[3rem] shadow-2xl border border-[#E7E0D6] flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-black text-[#A1887F] uppercase mb-10 tracking-[0.2em]">Efficiency Rating</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
             <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-[#FAF7F2]" />
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="currentColor"
                strokeWidth="20"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * analysis.healthScore) / 100}
                strokeLinecap="round"
                className={`${getHealthColor(analysis.healthScore)} transition-all duration-1500 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className={`text-6xl font-black ${getHealthColor(analysis.healthScore)} tracking-tighter`}>{analysis.healthScore}</span>
              <span className="text-[10px] font-black text-[#A1887F] uppercase tracking-widest mt-1">Score / 100</span>
            </div>
          </div>
          <div className="mt-10">
            <span className={`px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-widest bg-[#FAF7F2] ${getHealthColor(analysis.healthScore)} shadow-sm inline-block`}>
              Status: {analysis.healthScore > 80 ? 'Optimal' : analysis.healthScore > 60 ? 'Healthy' : 'Correction Required'}
            </span>
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="md:col-span-8 bg-[#5D4037] p-12 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(93,64,55,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
          <h3 className="text-xs font-black text-[#D7CCC8] uppercase mb-6 tracking-[0.3em] flex items-center gap-3">
             <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
             AI Intelligence Summary
          </h3>
          <p className="text-2xl font-bold text-white leading-relaxed tracking-tight italic opacity-95">
            "{analysis.summary}"
          </p>
          <div className="mt-8 flex gap-3">
             {['Optimization Ready', 'Secure Records'].map(tag => (
               <span key={tag} className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black text-[#D7CCC8] uppercase tracking-widest border border-white/10">{tag}</span>
             ))}
          </div>
        </div>

        {/* Breakdown Chart (Interactive Pie) */}
        <div className="md:col-span-6 bg-white p-10 rounded-[3rem] shadow-2xl border border-[#E7E0D6]">
          <h3 className="text-xs font-black text-[#A1887F] uppercase mb-6 tracking-[0.2em]">Allocation Breakdown</h3>
          <p className="text-[10px] text-[#8D6E63] font-bold uppercase mb-10 tracking-widest">Hover slices for deep metrics</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activePieIndex}
                  activeShape={(props: any) => renderActiveShape(props, currency)}
                  data={analysis.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={onPieEnter}
                >
                  {analysis.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ display: 'none' }} // Custom shape handles visual feedback
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Graph (Interactive Area/Line) */}
        <div className="md:col-span-6 bg-white p-10 rounded-[3rem] shadow-2xl border border-[#E7E0D6]">
          <h3 className="text-xs font-black text-[#A1887F] uppercase mb-6 tracking-[0.2em]">Temporal Trends ({currency.symbol})</h3>
          <p className="text-[10px] text-[#8D6E63] font-bold uppercase mb-10 tracking-widest">Drag bottom slider to adjust timeframe</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.trendAnalysis} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D4037" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#5D4037" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF7F2" />
                <XAxis dataKey="date" stroke="#A1887F" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#A1887F" fontSize={10} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => formatLargeValue(val, currency)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#5D4037', borderRadius: '1.5rem', border: 'none', fontWeight: 'bold', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatLargeValue(value, currency), 'Total Spent']}
                />
                <Area type="monotone" dataKey="amount" stroke="#5D4037" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                <Line type="monotone" dataKey="amount" stroke="#5D4037" strokeWidth={4} dot={{ r: 4, fill: '#5D4037', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Brush 
                  dataKey="date" 
                  height={30} 
                  stroke="#E7E0D6" 
                  fill="#FAF7F2"
                  className="rounded-full"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="md:col-span-12 bg-white p-12 rounded-[3.5rem] shadow-2xl border border-[#E7E0D6]">
          <div className="flex items-center gap-4 mb-12">
             <div className="w-14 h-14 bg-[#FAF7F2] text-[#5D4037] rounded-[1.5rem] flex items-center justify-center shadow-inner">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
               <h3 className="text-2xl font-black text-[#5D4037]">Behavioral Anomalies</h3>
               <p className="text-[10px] text-[#A1887F] uppercase font-black tracking-[0.3em]">AI Pattern Recognition Output</p>
             </div>
          </div>

          {analysis.anomalies.length === 0 ? (
            <div className="py-20 text-center bg-[#FAF7F2] rounded-[2.5rem] border-2 border-dashed border-[#E7E0D6]">
              <div className="text-4xl mb-4">🛡️</div>
              <p className="text-[#5D4037] font-black uppercase tracking-widest">No anomalies identified in this dataset cycle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysis.anomalies.map((anomaly, idx) => (
                <div key={idx} className="p-8 bg-[#FAF7F2] border border-[#E7E0D6] rounded-[2rem] flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-all">
                  <div className="flex-shrink-0">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getSeverityBadge(anomaly.severity)}`}>
                      {anomaly.severity} Priority
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl text-[#5D4037]">{anomaly.category}</span>
                      <span className="text-[#8D6E63] font-bold tracking-tight">/ {formatLargeValue(anomaly.amount, currency)}</span>
                    </div>
                    <p className="text-sm text-[#8D6E63] leading-relaxed font-medium italic">"{anomaly.reason}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <footer className="text-center py-16 opacity-40">
        <p className="text-[10px] font-black text-[#A1887F] uppercase tracking-[0.5em] mb-2">Powered by Smart Spend AI Core v2.4</p>
        <p className="text-[10px] font-bold text-[#A1887F] uppercase tracking-widest italic">All data encrypted and processed locally via Gemini 3 Flash</p>
      </footer>
    </div>
  );
};

export default DashboardScreen;
