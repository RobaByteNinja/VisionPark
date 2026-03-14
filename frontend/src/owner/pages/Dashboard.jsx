/**
 * COMPONENT: Dashboard
 * PURPOSE: Global network monitoring and aggregated statistics.
 *
 * ARCHITECTURE CONNECTIONS
 * Layer 5 (Presentation): React UI displaying aggregated system metrics and dynamic custom filters.
 * Layer 4 (Application): FastAPI calculates aggregated revenue, occupancy, and session data.
 * Layer 3 (AI Processing): AI events (vehicle detected) drive the occupancy metrics.
 * Layer 2 (Data Layer): Firebase Realtime Database acts as the source of truth for active sessions.
 * Layer 1 (Physical): Represents the global network of IP cameras updating spot statuses.
 */

import React, { useState } from "react";
import { 
  Car, CheckCircle, MapPin, TrendingUp, 
  Calendar, Clock, Banknote, Filter, ChevronDown, X, Check
} from "lucide-react";

// --- STRUCTURED DATA FOR CUSTOM DROPDOWNS ---
const REGION_GROUPS = [
  { group: "NATIONAL", options: ["All Regions"] },
  { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
  { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];

const CITIES_BY_REGION = {
  "Addis Ababa": ["Addis Ababa"],
  "Dire Dawa": ["Dire Dawa"],
  "Oromia Region": ["Adama"],
  "Amhara Region": ["Bahir Dar"],
  "Tigray Region": ["Mekelle"],
  "Somali Region": ["Jigjiga"],
  "Sidama Region": ["Hawassa"],
  "All Regions": ["All Cities"]
};

// ✅ ADDED: Unified Branch mapping to support auto-selection
const BRANCHES_BY_CITY = {
  "Addis Ababa": ["Bole Airport Parking", "Piazza Street Parking", "Meskel Square Parking"],
  "Dire Dawa": ["Dire Dawa Central Parking"], 
  "Adama": ["Adama Bus Terminal Parking", "Stadium Parking"],
  "Bahir Dar": ["Lake Tana Parking"], 
  "Mekelle": ["Mekelle City Parking"], 
  "Jigjiga": ["Jigjiga Market Parking"], 
  "Hawassa": ["Hawassa Park & Ride"], 
  "All Cities": ["All Branches"]
};

// --- MOCK DASHBOARD DATA ---
const DASHBOARD_STATS = { activeSessions: 142, availableSpots: 58, occupiedSpots: 142, revenueToday: 12450 };

const RECENT_ACTIVITY = [
  { id: 1, plate: "AA 12345", category: "Public Transport", spot: "A01", branch: "Bole Airport Parking", entry: "08:15 AM", exit: "--", duration: "2h 15m", payment: "Telebirr" },
  { id: 2, plate: "DR 98765", category: "Dry Freight", spot: "C12", branch: "Adama Bus Terminal", entry: "09:30 AM", exit: "10:15 AM", duration: "45m", payment: "CBE" },
  { id: 3, plate: "MO 55521", category: "Motorcycle", spot: "M05", branch: "Piazza Street Parking", entry: "10:00 AM", exit: "--", duration: "30m", payment: "COOP" },
  { id: 4, plate: "AA 11223", category: "Public Transport", spot: "B08", branch: "Bole Airport Parking", entry: "07:00 AM", exit: "10:00 AM", duration: "3h 0m", payment: "Wallet" },
];

export default function Dashboard() {
  const [region, setRegion] = useState("All Regions");
  const [city, setCity] = useState("All Cities");
  const [branch, setBranch] = useState("All Branches");

  // Custom Modal States
  const [activeDropdown, setActiveDropdown] = useState(null); // 'region', 'city', 'branch', or null

  const closeDropdown = () => setActiveDropdown(null);

  // ✅ ADDED: Smart Cascading Logic for Regions
  const handleRegionSelect = (selectedRegion) => {
    let nextCity = "All Cities";
    let nextBranch = "All Branches";

    if (selectedRegion !== "All Regions") {
      const availableCities = CITIES_BY_REGION[selectedRegion] || [];
      if (availableCities.length === 1) {
        nextCity = availableCities[0];
        const availableBranches = BRANCHES_BY_CITY[nextCity] || [];
        if (availableBranches.length === 1) {
          nextBranch = availableBranches[0];
        }
      }
    }

    setRegion(selectedRegion);
    setCity(nextCity);
    setBranch(nextBranch);
    closeDropdown();
  };

  // ✅ ADDED: Smart Cascading Logic for Cities
  const handleCitySelect = (selectedCity) => {
    let nextBranch = "All Branches";
    if (selectedCity !== "All Cities") {
      const availableBranches = BRANCHES_BY_CITY[selectedCity] || [];
      if (availableBranches.length === 1) {
        nextBranch = availableBranches[0];
      }
    }
    setCity(selectedCity);
    setBranch(nextBranch);
    closeDropdown();
  };

  // Reusable trigger button for our custom dropdowns
  const DropdownTrigger = ({ label, value, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500 cursor-pointer'}`}
    >
      <span className="truncate pr-4">{value}</span>
      <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 relative pb-10">
      
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">System Dashboard</h1>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">Real-time overview of your parking infrastructure.</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#121214] px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm shrink-0">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Today, Oct 24</span>
          </div>
        </div>

        {/* CUSTOM FILTERS ROW */}
        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm w-full">
          <div className="flex items-center gap-2 mb-3 md:hidden">
            <Filter className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Filter Scope</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <DropdownTrigger label="Region" value={region} onClick={() => setActiveDropdown('region')} />
            <DropdownTrigger label="City" value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown('city')} />
            <DropdownTrigger label="Branch" value={branch} disabled={city === "All Cities"} onClick={() => setActiveDropdown('branch')} />
          </div>
        </div>
      </div>

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Active Sessions</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><Car className="h-5 w-5 text-blue-500" /></div>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{DASHBOARD_STATS.activeSessions}</span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Available Spots</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{DASHBOARD_STATS.availableSpots}</span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Occupied Spots</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><MapPin className="h-5 w-5 text-amber-500" /></div>
          </div>
          <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">{DASHBOARD_STATS.occupiedSpots}</span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Revenue Today</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><Banknote className="h-5 w-5 text-indigo-500" /></div>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{DASHBOARD_STATS.revenueToday} <span className="text-lg font-medium text-zinc-500">ETB</span></span>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Donut Chart */}
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-6">Parking Occupancy</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-[16px] border-amber-400 dark:border-amber-500" style={{ borderRightColor: 'transparent', transform: 'rotate(-45deg)' }}>
              <div className="absolute inset-0 rounded-full border-[16px] border-emerald-400 dark:border-emerald-500" style={{ borderLeftColor: 'transparent', borderTopColor: 'transparent', transform: 'rotate(45deg)' }}></div>
              <div className="h-full w-full bg-white dark:bg-[#121214] rounded-full absolute flex flex-col items-center justify-center" style={{ transform: 'rotate(45deg)' }}>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">71%</span>
                <span className="text-xs text-zinc-500">Full</span>
              </div>
            </div>
            <div className="w-full flex justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm"><div className="h-3 w-3 rounded-full bg-amber-500"></div><span className="text-zinc-600 dark:text-zinc-400">Occupied (142)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="h-3 w-3 rounded-full bg-emerald-500"></div><span className="text-zinc-600 dark:text-zinc-400">Available (58)</span></div>
            </div>
          </div>
        </div>

        {/* Hourly Revenue Line Chart */}
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Revenue Per Hour</h2>
            <TrendingUp className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 w-full pt-4 relative">
            {[20, 40, 30, 70, 85, 60, 90, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end group">
                <div className="w-full bg-emerald-500/20 dark:bg-emerald-500/10 rounded-t-md relative transition-all duration-300 group-hover:bg-emerald-500/40" style={{ height: `${height}%` }}>
                  <div className="absolute top-0 w-full h-1 bg-emerald-500 rounded-t-md"></div>
                </div>
                <span className="text-[10px] sm:text-xs text-center text-zinc-500 mt-2">{8 + i}:00</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Row */}
      <div className="w-full">
        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Recent Activity</h2>
            <Clock className="h-5 w-5 text-zinc-400" />
          </div>
          
          <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/10 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="pb-3 font-semibold">Plate Number</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Branch</th>
                  <th className="pb-3 font-semibold">Entry / Exit</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {RECENT_ACTIVITY.map((session) => (
                  <tr key={session.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-zinc-900 dark:text-white">{session.plate}</td>
                    <td className="py-4 text-zinc-600 dark:text-zinc-300">{session.category}</td>
                    <td className="py-4 text-zinc-700 dark:text-zinc-300 font-medium">{session.branch}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-white">{session.entry}</span>
                        <span className="text-xs text-zinc-500">{session.exit}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-zinc-700 dark:text-zinc-300">{session.duration}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {session.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CUSTOM SELECT MODALS (PERFECTLY CENTERED) --- */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeDropdown}></div>
          
          <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Select {activeDropdown === 'region' ? 'Region' : activeDropdown === 'city' ? 'City' : 'Branch'}
              </h2>
              <button onClick={closeDropdown} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-2 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
              
              {/* REGION SELECTION */}
              {activeDropdown === 'region' && REGION_GROUPS.map((group) => (
                <div key={group.group} className="mb-2">
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{group.group}</div>
                  <div className="flex flex-col gap-1">
                    {group.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleRegionSelect(opt)} // ✅ UPDATED
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors outline-none ${region === opt ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                      >
                        {opt}
                        {region === opt && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* CITY SELECTION */}
              {activeDropdown === 'city' && (
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => handleCitySelect("All Cities")} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors outline-none ${city === "All Cities" ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                    All Cities {city === "All Cities" && <Check className="h-4 w-4" />}
                  </button>
                  {CITIES_BY_REGION[region]?.filter(c => c !== "All Cities").map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleCitySelect(opt)} // ✅ UPDATED
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors outline-none ${city === opt ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                    >
                      {opt}
                      {city === opt && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}

              {/* BRANCH SELECTION */}
              {activeDropdown === 'branch' && (
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => { setBranch("All Branches"); closeDropdown(); }} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors outline-none ${branch === "All Branches" ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                    All Branches {branch === "All Branches" && <Check className="h-4 w-4" />}
                  </button>
                  
                  {/* ✅ UPDATED: Now uses dynamic branches mapping based on city */}
                  {(BRANCHES_BY_CITY[city] || []).filter(c => c !== "All Branches").map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setBranch(opt); closeDropdown(); }}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors outline-none ${branch === opt ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                    >
                      {opt}
                      {branch === opt && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollbar styling matches the rest of the app */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
      `}</style>
    </div>
  );
}