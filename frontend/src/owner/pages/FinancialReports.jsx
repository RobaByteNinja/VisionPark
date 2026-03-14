/**
 * COMPONENT: FinancialReports
 * PURPOSE: Track parking revenue, platform fees, payment methods (Pie Chart), and dynamic revenue trends.
 *
 * ARCHITECTURE CONNECTIONS
 * Layer 5 (Presentation): React UI displaying financial aggregations, CSS-based charts, and exportable tables.
 * Layer 4 (Application): FastAPI calculates revenue splits and aggregates time-series data for the charts.
 * Layer 3 (AI Processing): AI-verified entry/exit times dictate the final billed duration.
 * Layer 2 (Data Layer): Firebase stores secure transactions and manages the VisionPark Wallet ledger.
 * Layer 1 (Physical): N/A.
 */

import React, { useState } from "react";
import { 
  Banknote, Download, Calendar, TrendingUp, 
  CreditCard, ChevronDown, Check, X, FileText, 
  ArrowUpRight, Activity, Filter, Info
} from "lucide-react";

// --- REQUIRED DATA STRUCTURES FOR DROPDOWNS ---
const REGION_GROUPS = [
  { group: "NATIONAL", options: ["All Regions"] },
  { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
  { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];

const CITIES_BY_REGION = {
  "Addis Ababa": ["Addis Ababa"], "Dire Dawa": ["Dire Dawa"],
  "Oromia Region": ["Adama"], "Amhara Region": ["Bahir Dar"],
  "Tigray Region": ["Mekelle"], "Somali Region": ["Jigjiga"], "Sidama Region": ["Hawassa"],
  "All Regions": ["All Cities"]
};

const BRANCHES_BY_CITY = {
  "Addis Ababa": ["Bole Airport Parking", "Piazza Street Parking", "Meskel Square Parking"],
  "Adama": ["Adama Bus Terminal Parking", "Stadium Parking"],
  "Dire Dawa": ["Dire Dawa Central Parking"],
  "Bahir Dar": ["Bahir Dar Lake Parking"],
  "Mekelle": ["Mekelle City Parking"],
  "Jigjiga": ["Jigjiga Market Parking"],
  "Hawassa": ["Hawassa Park & Ride"],
  "All Cities": ["All Branches"]
};

// --- MOCK DATA ---
const SUMMARY_STATS = { totalGross: 145000, platformFee: 7250, netEarnings: 137750 };

const PAYMENT_BREAKDOWN = [
  { method: "Telebirr", percentage: 45, amount: 65250, color: "bg-[#3b82f6]", hex: "#3b82f6" }, 
  { method: "CBE", percentage: 25, amount: 36250, color: "bg-[#a855f7]", hex: "#a855f7" }, 
  { method: "COOP", percentage: 15, amount: 21750, color: "bg-[#f97316]", hex: "#f97316" }, 
  { method: "Bank of Abyssinia", percentage: 10, amount: 14500, color: "bg-[#eab308]", hex: "#eab308" }, 
  { method: "VisionPark Wallet", percentage: 5, amount: 7250, color: "bg-[#10b981]", hex: "#10b981" }, 
];

const CHART_DATA = {
  daily: [40, 60, 45, 80, 65, 90, 100], 
  weekly: [65, 75, 60, 95], 
  monthly: [50, 55, 60, 45, 70, 85, 90, 80, 95, 100, 110, 120] 
};

const TRANSACTIONS = [
  { id: "TXN-8821A", date: "2026-03-10 14:30", plate: "AA 12345", branch: "Bole Airport", duration: "2h 15m", amount: 120, method: "Telebirr", status: "Completed" },
  { id: "TXN-8822B", date: "2026-03-10 14:15", plate: "OR 98765", branch: "Adama Bus Terminal", duration: "45m", amount: 40, method: "CBE", status: "Completed" },
  { id: "TXN-8823C", date: "2026-03-10 13:50", plate: "DR 55521", branch: "Piazza Street", duration: "3h 0m", amount: 150, method: "Wallet", status: "Completed" },
  { id: "TXN-8824D", date: "2026-03-10 13:20", plate: "AA 11223", branch: "Bole Airport", duration: "1h 30m", amount: 80, method: "Bank of Abyssinia", status: "Completed" },
  { id: "TXN-8825E", date: "2026-03-10 12:45", plate: "SM 33445", branch: "Adama Bus Terminal", duration: "Ovr: 1h", amount: 105, method: "COOP", status: "Completed" },
];

// ✅ MOVED OUTSIDE: Prevents the re-rendering / flashing bug
const DropdownTrigger = ({ label, value, onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`w-full min-w-0 flex items-center justify-between gap-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-sm font-medium rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed text-zinc-500' : 'text-zinc-900 dark:text-white hover:border-emerald-500 cursor-pointer'}`}>
    <span className="flex items-center gap-2 text-zinc-500 truncate">{label} <span className={`font-bold truncate ${disabled ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>{value}</span></span>
    <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
  </button>
);

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState("This Month");
  const [region, setRegion] = useState("All Regions");
  const [city, setCity] = useState("All Cities");
  const [branch, setBranch] = useState("All Branches");
  
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [chartView, setChartView] = useState("daily"); 

  const formatCurrency = (num) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0 }).format(num);

  const getPieGradient = () => {
    let gradient = [];
    let currentPercent = 0;
    PAYMENT_BREAKDOWN.forEach((item) => {
      const start = currentPercent;
      const end = currentPercent + item.percentage;
      gradient.push(`${item.hex} ${start}% ${end}%`);
      currentPercent = end;
    });
    return `conic-gradient(${gradient.join(', ')})`;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 relative pb-10">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Financial Reports</h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">Track revenue, platform fees, and payment methods.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors outline-none">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all outline-none">
            <FileText className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-50/50 dark:bg-black/10 p-3 md:p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Report Scope</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <DropdownTrigger label="Region:" value={region} onClick={() => setActiveDropdown('region')} />
          <DropdownTrigger label="City:" value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown('city')} />
          <DropdownTrigger label="Branch:" value={branch} disabled={city === "All Cities"} onClick={() => setActiveDropdown('branch')} />
          <DropdownTrigger label={<Calendar className="h-4 w-4" />} value={dateRange} onClick={() => setActiveDropdown('date')} />
        </div>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gross Revenue</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Banknote className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">{formatCurrency(SUMMARY_STATS.totalGross)}</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-2">
              <ArrowUpRight className="h-3 w-3" /> +12.5% from last period
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">System Fee (5%)</span>
            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg"><Activity className="h-5 w-5 text-red-500" /></div>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(SUMMARY_STATS.platformFee)}</span>
            <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium mt-2">Auto-deducted prior to payout</div>
          </div>
        </div>

        <div className="bg-emerald-500 p-6 rounded-2xl border border-emerald-400 shadow-lg shadow-emerald-500/20 flex flex-col justify-between text-zinc-950 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider opacity-80">Net Earnings</span>
            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl md:text-4xl font-black">{formatCurrency(SUMMARY_STATS.netEarnings)}</span>
            <div className="flex items-center gap-1 opacity-90 text-xs font-bold mt-2">Ready for Withdrawal</div>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Revenue Trend</h2>
            
            <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-1 rounded-xl w-max">
              {['daily', 'weekly', 'monthly'].map(view => (
                <button 
                  key={view} type="button"
                  onClick={() => setChartView(view)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize outline-none transition-colors ${chartView === view ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-3 h-48 w-full pt-4 relative">
            {CHART_DATA[chartView].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end group h-full relative">
                {/* ✅ INCREASED OPACITY FOR DAILY CHART VISIBILITY */}
                <div 
                  className={`w-full relative transition-all duration-500 group-hover:opacity-80 flex flex-col justify-end items-center ${chartView === 'daily' ? 'bg-emerald-500/50 dark:bg-emerald-500/60' : 'bg-emerald-500 rounded-t-md'}`} 
                  style={{ height: `${height}%` }}
                >
                  {chartView === 'daily' && <div className="h-2 w-2 bg-emerald-500 rounded-full absolute -top-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
                </div>
                <span className="text-[10px] sm:text-xs text-center text-zinc-500 mt-2 truncate">
                  {chartView === 'daily' ? `D${i+1}` : chartView === 'weekly' ? `Wk ${i+1}` : `M${i+1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PIE CHART: Payment Methods */}
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Payment Methods</h2>
            <CreditCard className="h-5 w-5 text-zinc-400" />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-start gap-6">
            <div 
              className="h-36 w-36 rounded-full shadow-inner border-[4px] border-white dark:border-[#121214]"
              style={{ background: getPieGradient() }}
            ></div>

            <div className="w-full flex flex-col gap-2">
              {PAYMENT_BREAKDOWN.map((method) => (
                <div key={method.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm ${method.color}`}></span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{method.method}</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">{method.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 flex gap-2 items-start">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              <strong className="text-zinc-700 dark:text-zinc-300">VisionPark Wallet</strong> includes unused reservation penalties (50% retained), session under-utilization balances, and overpayments.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Transactions Table */}
      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Transaction Ledger
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-zinc-600 dark:text-zinc-400">{tx.id}</td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-white">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-900 dark:text-white block">{tx.plate}</span>
                    <span className="text-xs text-zinc-500">{tx.branch} • {tx.duration}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {tx.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <Check className="h-3 w-3" /> {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CUSTOM MODALS FOR FILTERS --- */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setActiveDropdown(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Select {activeDropdown === 'date' ? 'Date Range' : activeDropdown === 'region' ? 'Region' : activeDropdown === 'city' ? 'City' : 'Branch'}</h2>
              <button type="button" onClick={() => setActiveDropdown(null)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors outline-none"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              
              {activeDropdown === 'date' && ["Today", "This Week", "This Month", "Last Month", "Year to Date"].map(opt => (
                <button type="button" key={opt} onClick={() => { setDateRange(opt); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none">
                  {opt} {dateRange === opt && <Check className="h-4 w-4 text-emerald-500" />}
                </button>
              ))}

              {activeDropdown === 'region' && REGION_GROUPS.map((group) => (
                <div key={group.group} className="mb-2">
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{group.group}</div>
                  <div className="flex flex-col gap-1">
                    {group.options.map(opt => (
                      <button type="button" key={opt} onClick={() => { setRegion(opt); setCity(opt === "All Regions" ? "All Cities" : CITIES_BY_REGION[opt][0]); setBranch(opt === "All Regions" ? "All Branches" : (BRANCHES_BY_CITY[CITIES_BY_REGION[opt][0]]?.[0] || "All Branches")); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none">
                        {opt} {region === opt && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {activeDropdown === 'city' && (
                <>
                  <button type="button" onClick={() => { setCity("All Cities"); setBranch("All Branches"); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mb-1">
                    All Cities {city === "All Cities" && <Check className="h-4 w-4 text-emerald-500" />}
                  </button>
                  {CITIES_BY_REGION[region]?.filter(c => c !== "All Cities").map(opt => (
                    <button type="button" key={opt} onClick={() => { setCity(opt); setBranch(BRANCHES_BY_CITY[opt]?.[0] || "All Branches"); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mt-1">
                      {opt} {city === opt && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))}
                </>
              )}

              {activeDropdown === 'branch' && (
                <>
                  <button type="button" onClick={() => { setBranch("All Branches"); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mb-1">
                    All Branches {branch === "All Branches" && <Check className="h-4 w-4 text-emerald-500" />}
                  </button>
                  {BRANCHES_BY_CITY[city]?.filter(b => b !== "All Branches").map(opt => (
                    <button type="button" key={opt} onClick={() => { setBranch(opt); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mt-1">
                      {opt} {branch === opt && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}