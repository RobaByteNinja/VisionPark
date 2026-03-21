/**
 * COMPONENT: Analytics
 * PURPOSE: Deep behavioral insights, performance trends, and operational analysis.
 * STRICT RULE: No real-time operational counters (e.g., active sessions, live revenue).
 */

import React, { useState } from "react";
import {
  BarChart3, Clock, Layers, Car, Check, ChevronDown, Repeat,
  Activity, CalendarDays, MapPin, BarChart2, Filter, X
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// --- REGION / CITY / BRANCH HIERARCHY ---
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
  "Dire Dawa": ["Dire Dawa Central Parking"],
  "Adama": ["Adama Bus Terminal Parking", "Stadium Parking"],
  "Bahir Dar": ["Lake Tana Parking"],
  "Mekelle": ["Mekelle City Parking"],
  "Jigjiga": ["Jigjiga Market Parking"],
  "Hawassa": ["Hawassa Park & Ride"],
  "All Cities": ["All Branches"]
};

// --- MOCK DATA ---
const UTILIZATION_DATA = [
  { hour: "00:00", value: 12 }, { hour: "01:00", value: 8 }, { hour: "02:00", value: 5 },
  { hour: "03:00", value: 4 }, { hour: "04:00", value: 10 }, { hour: "05:00", value: 25 },
  { hour: "06:00", value: 55 }, { hour: "07:00", value: 85 }, { hour: "08:00", value: 95 },
  { hour: "09:00", value: 92 }, { hour: "10:00", value: 88 }, { hour: "11:00", value: 85 },
  { hour: "12:00", value: 80 }, { hour: "13:00", value: 78 }, { hour: "14:00", value: 75 },
  { hour: "15:00", value: 80 }, { hour: "16:00", value: 88 }, { hour: "17:00", value: 96 },
  { hour: "18:00", value: 90 }, { hour: "19:00", value: 70 }, { hour: "20:00", value: 45 },
  { hour: "21:00", value: 30 }, { hour: "22:00", value: 20 }, { hour: "23:00", value: 15 },
];

const PEAK_HOURS = [
  { time: "06:00", value: 15 }, { time: "08:00", value: 65 }, { time: "10:00", value: 85 },
  { time: "12:00", value: 100 }, { time: "14:00", value: 75 }, { time: "16:00", value: 60 },
  { time: "18:00", value: 95 }, { time: "20:00", value: 40 }, { time: "22:00", value: 15 }
];

const ZONE_DATA = [
  { name: "Zone A (Light)", utilization: 91 },
  { name: "Zone B (Buses)", utilization: 72 },
  { name: "Zone C (Freight)", utilization: 48 },
];

const VEHICLE_CATEGORIES = [
  { name: "Motorcycle | Motorcycle", percent: 34, color: "#3b82f6" },
  { name: "Public Transport | Upto 12 Seats", percent: 27, color: "#10b981" },
  { name: "Dry Freight | <35 Quintal", percent: 16, color: "#f59e0b" },
  { name: "Bicycle | Bicycle", percent: 15, color: "#8b5cf6" },
  { name: "Machineries | Upto 5000KG", percent: 8, color: "#a1a1aa" }
];

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEATMAP_HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const HEATMAP_DATA = HEATMAP_HOURS.map(hour => ({
  hour,
  days: HEATMAP_DAYS.map(() => Math.floor(Math.random() * 100))
}));

const getHeatmapColor = (value) => {
  if (value < 40) return "bg-emerald-500";
  if (value < 75) return "bg-amber-500";
  return "bg-red-500";
};

// Shared Recharts tooltip style — built inside the component so it reads the live themes

export default function Analytics() {
  const { theme } = useTheme();

  // ── CUSTOM TOOLTIPS ────────────────────────────────────────────────────────
  // Each chart gets its own tooltip so the value color matches the exact bar/line
  // being hovered. All share the same dark card base for consistency.

  const tooltipCard = {
    backgroundColor: "#1c1c1f",
    border: "1px solid #3f3f46",
    borderRadius: "0.75rem",
    padding: "10px 14px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
  };
  const labelStyle = { color: "#a1a1aa", fontWeight: 700, fontSize: 11, marginBottom: 4 };
  const valueStyle = (color) => ({ color, fontWeight: 800, fontSize: 14 });

  // Utilization area — always emerald to match the line
  const UtilizationTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    const color = v >= 76 ? "#f87171" : v >= 41 ? "#fbbf24" : "#34d399";
    return (
      <div style={tooltipCard}>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle(color)}>{v}% Utilization</p>
      </div>
    );
  };

  // Peak hours — color matches the actual bar (amber ≥90, blue otherwise)
  const PeakTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    const color = v >= 90 ? "#fbbf24" : "#60a5fa";
    return (
      <div style={tooltipCard}>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle(color)}>{v}% Occupancy</p>
      </div>
    );
  };

  // Zone performance — color matches the actual bar (amber >85, emerald otherwise)
  const ZoneTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    const color = v > 85 ? "#fbbf24" : "#34d399";
    return (
      <div style={tooltipCard}>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle(color)}>Utilization : {v}%</p>
      </div>
    );
  };

  // Vehicle category donut — color matches the exact slice being hovered
  const CategoryTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div style={tooltipCard}>
        <p style={labelStyle}>{item.name}</p>
        <p style={valueStyle(item.color)}>{item.percent}% of fleet</p>
      </div>
    );
  };

  const [region, setRegion] = useState("All Regions");
  const [city, setCity] = useState("All Cities");
  const [branch, setBranch] = useState("All Branches");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const closeDropdown = () => setActiveDropdown(null);

  const handleRegionSelect = (selectedRegion) => {
    let nextCity = "All Cities";
    let nextBranch = "All Branches";
    if (selectedRegion !== "All Regions") {
      const cities = CITIES_BY_REGION[selectedRegion] || [];
      if (cities.length === 1) {
        nextCity = cities[0];
        const branches = BRANCHES_BY_CITY[nextCity] || [];
        if (branches.length === 1) nextBranch = branches[0];
      }
    }
    setRegion(selectedRegion);
    setCity(nextCity);
    setBranch(nextBranch);
    closeDropdown();
  };

  const handleCitySelect = (selectedCity) => {
    let nextBranch = "All Branches";
    if (selectedCity !== "All Cities") {
      const branches = BRANCHES_BY_CITY[selectedCity] || [];
      if (branches.length === 1) nextBranch = branches[0];
    }
    setCity(selectedCity);
    setBranch(nextBranch);
    closeDropdown();
  };

  const DropdownTrigger = ({ value, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 outline-none transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-emerald-500 cursor-pointer"}`}
    >
      <span className="truncate pr-4">{value}</span>
      <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500 pb-10 relative">

      {/* ── HEADER + FILTERS ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">Behavioral insights, performance trends, and operational analysis.</p>
        </div>
        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 md:hidden">
            <Filter className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Filter Scope</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DropdownTrigger value={region} onClick={() => setActiveDropdown("region")} />
            <DropdownTrigger value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown("city")} />
            <DropdownTrigger value={branch} disabled={city === "All Cities"} onClick={() => setActiveDropdown("branch")} />
          </div>
        </div>
      </div>

      {/* ── UTILIZATION INTELLIGENCE ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 shrink-0" />
          <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Utilization Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Parking Utilization Rate — Recharts AreaChart */}
          <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">Parking Utilization Rate</h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">Measures how full the parking system becomes during the day.</p>
            </div>

            {/* KPI strip */}
            <div className="flex gap-4 mb-5 border-b border-zinc-100 dark:border-white/5 pb-4 shrink-0">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Average</span>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">62%</p>
              </div>
              <div className="flex-1 border-l border-zinc-100 dark:border-white/5 pl-4">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Peak</span>
                <p className="text-xl font-bold text-red-500">96%</p>
              </div>
              <div className="flex-1 border-l border-zinc-100 dark:border-white/5 pl-4">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Lowest</span>
                <p className="text-xl font-bold text-emerald-500">4%</p>
              </div>
            </div>

            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={UTILIZATION_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={5}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<UtilizationTooltip />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#utilGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
              <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 0–40% Low</span>
              <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 41–75% Med</span>
              <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500" /> 76–100% High</span>
            </div>
          </div>

          {/* Occupancy Heatmap — kept as-is, it's a grid not a chart */}
          <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-amber-500 shrink-0" /> Occupancy Heatmap
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">Visualize parking demand patterns across the week.</p>
            </div>
            <div className="w-full overflow-x-auto flex-1 custom-scrollbar pb-2">
              <div className="min-w-[450px]">
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div />
                  {HEATMAP_DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-black uppercase text-zinc-400 tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  {HEATMAP_DATA.map((row, i) => (
                    <div key={i} className="grid grid-cols-8 gap-1 sm:gap-1.5">
                      <div className="text-right pr-2 text-[10px] font-bold text-zinc-500 flex items-center justify-end">{row.hour}</div>
                      {row.days.map((val, j) => (
                        <div
                          key={j}
                          className={`h-8 sm:h-10 rounded-md ${getHeatmapColor(val)} opacity-90 hover:opacity-100 hover:ring-2 hover:ring-white dark:hover:ring-black transition-all cursor-pointer`}
                          title={`${val}% Full`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-zinc-100 dark:border-white/5 text-[10px] font-black uppercase text-zinc-400 justify-end">
              <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-emerald-500" /> Low</span>
              <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-amber-500" /> Med</span>
              <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-red-500" /> High</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── OPERATIONAL BEHAVIOR ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500 shrink-0" />
          <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Operational Behavior</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Peak Hour Analysis — Recharts BarChart */}
          <div className="bg-white dark:bg-[#121214] p-4 sm:p-5 lg:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm md:col-span-2 flex flex-col overflow-hidden">
            <div className="mb-4">
              <h3 className="text-base xl:text-lg font-bold text-zinc-900 dark:text-white mb-1">Peak Hour Analysis</h3>
              <p className="text-xs xl:text-sm text-zinc-500">Busiest recorded entry periods.</p>
            </div>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PEAK_HOURS} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#71717a", fontSize: 10, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<PeakTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                    {PEAK_HOURS.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.value >= 90 ? "#f59e0b" : "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Parking Duration — stat card, no chart needed */}
          <div className="bg-white dark:bg-[#121214] p-4 sm:p-5 lg:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden">
            <div className="mb-4">
              <h3 className="text-base xl:text-lg font-bold text-zinc-900 dark:text-white mb-1 leading-tight break-words">Average Parking Duration</h3>
              <p className="text-xs xl:text-sm text-zinc-500 leading-snug">Average time vehicles remain parked.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center py-6 border-y border-zinc-100 dark:border-white/5">
              <Clock className="h-8 w-8 text-amber-500 mb-3 shrink-0" />
              <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white">1h 42m</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs lg:text-sm gap-2">
                <span className="text-zinc-500 truncate" title="Dry Freight Vehicles | <35 Quintal">Dry Freight (&lt;35Q)</span>
                <span className="font-bold text-zinc-900 dark:text-white shrink-0">2h 15m</span>
              </div>
              <div className="flex justify-between items-center text-xs lg:text-sm gap-2">
                <span className="text-zinc-500 truncate">Motorcycles</span>
                <span className="font-bold text-zinc-900 dark:text-white shrink-0">45m</span>
              </div>
            </div>
          </div>

          {/* Turnover Rate — stat card */}
          <div className="bg-white dark:bg-[#121214] p-4 sm:p-5 lg:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden">
            <div className="mb-4">
              <h3 className="text-base xl:text-lg font-bold text-zinc-900 dark:text-white mb-1 leading-tight break-words">Turnover Rate</h3>
              <p className="text-xs xl:text-sm text-zinc-500 leading-snug">Total vehicles / Total spots.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center py-6">
              <Repeat className="h-8 w-8 text-purple-500 mb-3 shrink-0" />
              <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white">6.2</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-4 text-center">
                Vehicles per spot<br />per day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INFRASTRUCTURE INSIGHTS ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 md:h-6 md:w-6 text-purple-500 shrink-0" />
          <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Infrastructure Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Zone Performance — Recharts horizontal BarChart */}
          <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-base xl:text-lg font-bold text-zinc-900 dark:text-white mb-1">Zone Performance</h3>
              <p className="text-xs xl:text-sm text-zinc-500">Utilization percentage for each designated parking zone.</p>
            </div>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ZONE_DATA}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#52525b" opacity={0.2} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    content={<ZoneTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="utilization" radius={[0, 8, 8, 0]} barSize={28}>
                    {ZONE_DATA.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.utilization > 85 ? "#f59e0b" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vehicle Category Distribution — Recharts PieChart donut */}
          <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-base xl:text-lg font-bold text-zinc-900 dark:text-white mb-1">Vehicle Category Distribution</h3>
              <p className="text-xs xl:text-sm text-zinc-500">Distribution based on official system taxonomy.</p>
            </div>
            <div className="flex flex-col xl:flex-row gap-8 items-center justify-between flex-1 w-full min-w-0">

              {/* Legend */}
              <div className="w-full xl:flex-1 space-y-4 min-w-0">
                {VEHICLE_CATEGORIES.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs sm:text-sm w-full gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-zinc-600 dark:text-zinc-300 truncate" title={cat.name}>{cat.name}</span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white shrink-0">{cat.percent}%</span>
                  </div>
                ))}
              </div>

              {/* Recharts donut — centered label via absolute overlay */}
              <div className="shrink-0 relative h-40 w-40 sm:h-48 sm:w-48 flex items-center justify-center mx-auto xl:mx-0">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <Car className="h-5 w-5 text-zinc-400 dark:text-zinc-500 mb-1" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Total Mix</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={VEHICLE_CATEGORIES}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="88%"
                      paddingAngle={3}
                      dataKey="percent"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {VEHICLE_CATEGORIES.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DROPDOWN MODALS ── */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDropdown} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/5 shrink-0">
              <h2 className="text-xl font-bold dark:text-white">
                Select {activeDropdown === "region" ? "Region" : activeDropdown === "city" ? "City" : "Branch"}
              </h2>
              <button onClick={closeDropdown} className="p-2 dark:text-zinc-400 hover:dark:text-white outline-none cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 overscroll-contain custom-scrollbar">

              {activeDropdown === "region" && REGION_GROUPS.map(group => (
                <div key={group.group} className="mb-4 last:mb-0">
                  <p className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{group.group}</p>
                  <div className="flex flex-col gap-1">
                    {group.options.map(opt => (
                      <button key={opt} onClick={() => handleRegionSelect(opt)}
                        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer ${region === opt ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                        {opt} {region === opt && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {activeDropdown === "city" && (
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => handleCitySelect("All Cities")}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer ${city === "All Cities" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                    All Cities {city === "All Cities" && <Check className="h-4 w-4 text-emerald-500" />}
                  </button>
                  {CITIES_BY_REGION[region]?.filter(c => c !== "All Cities").map(opt => (
                    <button key={opt} onClick={() => handleCitySelect(opt)}
                      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer ${city === opt ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                      {opt} {city === opt && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {activeDropdown === "branch" && (
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => { setBranch("All Branches"); closeDropdown(); }}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer ${branch === "All Branches" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                    All Branches {branch === "All Branches" && <Check className="h-4 w-4 text-emerald-500" />}
                  </button>
                  {(BRANCHES_BY_CITY[city] || []).filter(c => c !== "All Branches").map(opt => (
                    <button key={opt} onClick={() => { setBranch(opt); closeDropdown(); }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer ${branch === opt ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                      {opt} {branch === opt && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}