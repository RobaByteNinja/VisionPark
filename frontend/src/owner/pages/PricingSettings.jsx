/**
 * COMPONENT: PricingSettings
 * PURPOSE: Branch-specific configuration for hourly rates, categorized logically, and dynamic overstay penalty multipliers.
 */

import React, { useState, useEffect } from "react";
import { 
  Save, ShieldAlert, Car, Info, CheckCircle, 
  ChevronDown, ChevronUp, Check, X, MapPin, Calculator, Clock
} from "lucide-react";

// --- UPDATED REGION DATA STRUCTURES ---
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

// --- HIERARCHICAL VEHICLE CATEGORIES ---
const VEHICLE_GROUPS = [
  {
    group: "Public Transport",
    items: [
      "Public Transport Vehicles | Upto 12 Seats",
      "Public Transport Vehicles | 13-24 Seats",
      "Public Transport Vehicles | 25 Seats and above"
    ]
  },
  {
    group: "Two Wheelers",
    items: [
      "Bicycle | Bicycle",
      "Motorcycle | Motorcycle"
    ]
  },
  {
    group: "Dry Freight",
    items: [
      "Dry Freight Vehicles | <35 Quintal",
      "Dry Freight Vehicles | 36-70 Quintal",
      "Dry Freight Vehicles | >71 Quintal"
    ]
  },
  {
    group: "Liquid Cargo",
    items: [
      "Liquid Cargo Vehicles | Upto 28 Liter",
      "Liquid Cargo Vehicles | Above 28 Liter"
    ]
  },
  {
    group: "Machineries",
    items: [
      "Machineries | Upto 5000KG weight",
      "Machineries | 5001-10,000KG weight",
      "Machineries | Above 10,001KG weight"
    ]
  }
];

const ALL_CATEGORIES = VEHICLE_GROUPS.flatMap(g => g.items);

const INITIAL_DB = {
  "Bole Airport Parking": { multiplier: 2.0, rates: { "Motorcycle | Motorcycle": 20, "Public Transport Vehicles | Upto 12 Seats": 30 } },
  "Adama Bus Terminal Parking": { multiplier: 1.75, rates: { "Motorcycle | Motorcycle": 10, "Public Transport Vehicles | Upto 12 Seats": 20 } },
  "Piazza Street Parking": { multiplier: 1.5, rates: { "Motorcycle | Motorcycle": 25, "Public Transport Vehicles | Upto 12 Seats": 40 } }
};

const DEFAULT_RATES = ALL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 15 }), {});

// Reusable Dropdown
const DropdownTrigger = ({ label, value, onClick, disabled }) => (
  <button 
    type="button" onClick={onClick} disabled={disabled} 
    className={`w-full min-w-0 flex items-center justify-between gap-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-sm font-medium rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed text-zinc-500' : 'text-zinc-900 dark:text-white hover:border-emerald-500 cursor-pointer'}`}
  >
    <span className="flex items-center gap-2 text-zinc-500 truncate">
      {label} <span className={`font-bold truncate ${disabled ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>{value}</span>
    </span>
    <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
  </button>
);

export default function PricingSettings() {
  const [region, setRegion] = useState("All Regions");
  const [city, setCity] = useState("All Cities");
  const [branch, setBranch] = useState("All Branches");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [rates, setRates] = useState({});
  const [multiplier, setMultiplier] = useState(1.75);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const branchData = INITIAL_DB[branch] || { multiplier: 1.75, rates: DEFAULT_RATES };
    const mergedRates = { ...DEFAULT_RATES, ...branchData.rates };
    setRates(mergedRates);
    setMultiplier(branchData.multiplier);
  }, [branch]);

  const handleRateChange = (category, newVal) => {
    setRates(prev => ({ ...prev, [category]: newVal === "" ? "" : parseFloat(newVal) }));
  };

  const adjustMultiplier = (amount) => {
    setMultiplier(prev => {
      const current = parseFloat(prev || 1);
      const next = Math.max(1, current + amount);
      return next.toFixed(2);
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* ✅ CSS INJECTION: Permanently kills the native browser number arrows across the entire page */}
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Pricing Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure branch-specific hourly rates and overstay penalties.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
              <CheckCircle className="h-4 w-4" /> Saved Successfully
            </span>
          )}
          <button 
            type="button" onClick={handleSave} disabled={isSaving || !branch}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 outline-none"
          >
            {isSaving ? "Saving..." : <><Save className="h-5 w-5" /> Save Configuration</>}
          </button>
        </div>
      </div>

      {/* Target Branch Selector */}
      <div className="bg-zinc-50/50 dark:bg-black/10 p-3 md:p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Select Target Branch</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <DropdownTrigger label="Region:" value={region} onClick={() => setActiveDropdown('region')} />
          <DropdownTrigger label="City:" value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown('city')} />
          <DropdownTrigger label="Branch:" value={branch} disabled={city === "All Cities"} onClick={() => setActiveDropdown('branch')} />
        </div>
      </div>

      {branch ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: PENALTY LOGIC */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Overstay Multiplier Card */}
            <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <ShieldAlert className="h-5 w-5" />
                  <h2 className="font-bold text-zinc-900 dark:text-white">Overstay Policy</h2>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                Applied automatically when a vehicle remains in the lot after branch closing time. Base rates are multiplied by this value.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Penalty Multiplier</label>
                
                {/* Custom Input with Sleek Arrows */}
                <div className="relative flex items-center bg-zinc-50 dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                  <input 
                    type="number" step="0.05" min="1"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className="w-full bg-transparent text-zinc-900 dark:text-white text-lg font-bold pl-4 pr-24 py-3 outline-none"
                  />
                  <span className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm pointer-events-none">x Rate</span>
                  
                  {/* Thin, Cool Spin Buttons */}
                  <div className="absolute right-1 top-1 flex flex-col items-center justify-center h-[calc(100%-8px)] border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] rounded-r-lg">
                    <button 
                      type="button" onClick={() => adjustMultiplier(0.05)} 
                      className="flex-1 px-2 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" strokeWidth={3} />
                    </button>
                    <button 
                      type="button" onClick={() => adjustMultiplier(-0.05)} 
                      className="flex-1 px-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border-t border-zinc-100 dark:border-white/5"
                    >
                      <ChevronDown className="h-3 w-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Example Scenario Calculator */}
            <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl"></div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-zinc-400" /> Example Scenario
              </h4>
              
              <div className="space-y-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-zinc-400" /> Branch Closes At:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">18:00</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                  <span>Driver Parks At:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">16:00</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                  <span>Driver Leaves At:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">21:00</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-amber-600 dark:text-amber-500 font-bold">Total Overstay Time:</span>
                  <span className="text-amber-600 dark:text-amber-500 font-bold">3 Hours</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10">
                <p className="text-[10px] text-zinc-500 mb-2">Assuming Base Rate of 20 ETB/hr</p>
                <div className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-zinc-200 dark:border-white/5 space-y-1.5 shadow-sm">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Normal Fee (2 hrs × 20)</span>
                    <span className="font-bold dark:text-white">40 ETB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Overstay (3 hrs × {20 * parseFloat(multiplier || 1)} ETB)</span>
                    <span className="font-bold text-amber-500">{3 * (20 * parseFloat(multiplier || 1))} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-100 dark:border-white/5 font-black">
                    <span className="text-zinc-900 dark:text-white">Total Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-500">{40 + (3 * (20 * parseFloat(multiplier || 1)))} ETB</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: HIERARCHICAL RATE TABLE */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-zinc-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Rates: {branch}</h2>
                </div>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] uppercase tracking-widest text-zinc-400 bg-white dark:bg-[#121214]">
                      <th className="px-6 py-4 font-black">Vehicle Category</th>
                      <th className="px-6 py-4 font-black text-right w-36">Base Rate<br/>(ETB/Hr)</th>
                      <th className="px-6 py-4 font-black text-right w-36 text-amber-500">Overstay Rate<br/>(ETB/Hr)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {VEHICLE_GROUPS.map((group, gIndex) => (
                      <React.Fragment key={gIndex}>
                        <tr className="bg-zinc-50/80 dark:bg-white/[0.02] border-y border-zinc-100 dark:border-white/5">
                          <td colSpan="3" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                            {group.group}
                          </td>
                        </tr>
                        {group.items.map((cat, index) => {
                          const baseRate = rates[cat] || 0;
                          const penaltyRate = (baseRate * parseFloat(multiplier || 1)).toFixed(2);

                          return (
                            <tr key={index} className="border-b border-zinc-50 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors group">
                              <td className="px-6 py-3.5 font-medium text-zinc-700 dark:text-zinc-300 pl-10">
                                {cat}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="flex items-center justify-end">
                                  <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">ETB</span>
                                    <input 
                                      type="number" min="0"
                                      value={rates[cat] === undefined ? "" : rates[cat]}
                                      onChange={(e) => handleRateChange(cat, e.target.value)}
                                      className="w-full bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-right text-zinc-900 dark:text-white font-bold rounded-lg pl-10 pr-3 py-2 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#121214] focus:ring-1 focus:ring-emerald-500 transition-all"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="inline-flex items-center justify-end w-24 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20">
                                  {penaltyRate}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="w-full p-12 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
          <MapPin className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-4" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">No Branch Selected</h2>
          <p className="text-sm text-zinc-500 mt-1 max-w-md">Please select a Region, City, and Branch from the dropdowns above to configure its specific pricing structure.</p>
        </div>
      )}

      {/* --- CUSTOM SELECTION MODALS --- */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveDropdown(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/5">
              <h2 className="text-xl font-bold dark:text-white">Select {activeDropdown}</h2>
              <button type="button" onClick={() => setActiveDropdown(null)} className="p-2 dark:text-zinc-400 hover:dark:text-white outline-none"><X /></button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto overscroll-contain">
              {activeDropdown === 'region' && REGION_GROUPS.map(g => (
                <div key={g.group} className="mb-4">
                  <p className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{g.group}</p>
                  {g.options.map(o => (
                    <button key={o} type="button" onClick={() => { 
                      setRegion(o); 
                      const firstCity = o === "All Regions" ? "All Cities" : (CITIES_BY_REGION[o]?.[0] || "All Cities");
                      setCity(firstCity);
                      setBranch(firstCity === "All Cities" ? "All Branches" : (BRANCHES_BY_CITY[firstCity]?.[0] || "All Branches")); 
                      setActiveDropdown(null); 
                    }} className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${region === o ? 'bg-emerald-500/10 text-emerald-500' : 'dark:text-zinc-300 hover:dark:bg-white/5'}`}>
                      {o} {region === o && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              ))}
              {activeDropdown === 'city' && CITIES_BY_REGION[region]?.map(o => (
                <button key={o} type="button" onClick={() => { 
                  setCity(o); 
                  setBranch(o === "All Cities" ? "All Branches" : (BRANCHES_BY_CITY[o]?.[0] || "All Branches")); 
                  setActiveDropdown(null); 
                }} className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${city === o ? 'bg-emerald-500/10 text-emerald-500' : 'dark:text-zinc-300 hover:dark:bg-white/5'}`}>
                  {o} {city === o && <Check className="h-4 w-4" />}
                </button>
              ))}
              {activeDropdown === 'branch' && (
                BRANCHES_BY_CITY[city]?.length > 0 ? BRANCHES_BY_CITY[city].map(o => (
                  <button key={o} type="button" onClick={() => { setBranch(o); setActiveDropdown(null); }} className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${branch === o ? 'bg-emerald-500/10 text-emerald-500' : 'dark:text-zinc-300 hover:dark:bg-white/5'}`}>
                    {o} {branch === o && <Check className="h-4 w-4" />}
                  </button>
                )) : <div className="p-4 text-center text-zinc-500 text-sm">Select a valid city first.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}