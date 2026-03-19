import React, { useState, useMemo } from "react";
import {
    Cpu, Camera, Zap, Download, Gauge,
    ChevronDown, Activity, Server, X, Check, CheckCircle
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// ── DROPDOWN DATA ─────────────────────────────────────────────────────────────
const REGION_GROUPS = [
    { group: "NATIONAL", options: ["All Regions"] },
    { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
    { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];
const CITIES_BY_REGION = {
    "Addis Ababa": ["Addis Ababa"], "Dire Dawa": ["Dire Dawa"],
    "Oromia Region": ["Adama"], "Amhara Region": ["Bahir Dar"],
    "Tigray Region": ["Mekelle"], "Somali Region": ["Jigjiga"],
    "Sidama Region": ["Hawassa"], "All Regions": ["All Cities"]
};
const LOTS_BY_CITY = {
    "Addis Ababa": ["Bole Premium Lot", "Piazza Central", "Meskel Square Hub"],
    "Dire Dawa": ["Dire Dawa Central"],
    "Adama": ["Adama Terminal", "Stadium Parking"],
    "Bahir Dar": ["Lake Tana Parking"],
    "Mekelle": ["Mekelle City Parking"],
    "Jigjiga": ["Jigjiga Market Parking"],
    "Hawassa": ["Hawassa Park & Ride"],
    "All Cities": ["All Lots"]
};
const REGIONAL_AI_STATS = [
    { name: "Addis Ababa", code: "AA", nodes: 24, accuracy: 98.9, uptime: "99.9%" },
    { name: "Dire Dawa", code: "DD", nodes: 6, accuracy: 96.5, uptime: "98.2%" },
    { name: "Oromia (Adama)", code: "OR", nodes: 8, accuracy: 97.8, uptime: "99.1%" },
    { name: "Sidama (Hawassa)", code: "SI", nodes: 4, accuracy: 98.1, uptime: "99.5%" }
];

// ── TOOLTIP CARD BASE ─────────────────────────────────────────────────────────
// Defined at module level so tooltip components don't re-create on every render.
const TC = {
    backgroundColor: "#1c1c1f",
    border: "1px solid #3f3f46",
    borderRadius: "0.75rem",
    padding: "10px 14px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
};
const LBL = { color: "#a1a1aa", fontWeight: 700, fontSize: 11, marginBottom: 4 };
const VAL = (color) => ({ color, fontWeight: 800, fontSize: 14 });

// ── CUSTOM TOOLTIPS — all defined outside the component ───────────────────────
const ScansTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            <p style={VAL("#818cf8")}>{payload[0].value?.toLocaleString()} Scans</p>
        </div>
    );
};

const InferenceTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            <p style={VAL("#818cf8")}>{payload[0].value} ms</p>
        </div>
    );
};

const ResourceTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={VAL(p.dataKey === "cpu" ? "#f87171" : "#34d399")}>
                    {p.name}: {p.value}%
                </p>
            ))}
        </div>
    );
};

const OcrDonutTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const color = item.name === "Successful" ? "#34d399" : "#f87171";
    return (
        <div style={TC}>
            <p style={LBL}>{item.name}</p>
            <p style={VAL(color)}>{item.value?.toLocaleString()} reads</p>
        </div>
    );
};

const ConfDistTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            <p style={VAL("#818cf8")}>{payload[0].value?.toLocaleString()} Scans</p>
        </div>
    );
};

const OcrTrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            <p style={VAL("#34d399")}>{payload[0].value}% Confidence</p>
        </div>
    );
};

const LatencyTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={TC}>
            <p style={LBL}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={VAL(p.dataKey === "latency" ? "#a78bfa" : "#f87171")}>
                    {p.name}: {p.value}{p.dataKey === "latency" ? " ms" : "%"}
                </p>
            ))}
        </div>
    );
};

// ── DROPDOWN TRIGGER ──────────────────────────────────────────────────────────
const DropdownTrigger = ({ label, value, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs md:text-sm font-bold rounded-xl px-4 py-3 outline-none transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md"}`}
    >
        <span className="truncate pr-4">{value}</span>
        <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-zinc-400 shrink-0" />
    </button>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PlatformAnalytics() {
    const [timeRange, setTimeRange] = useState("7D");
    const [region, setRegion] = useState("All Regions");
    const [city, setCity] = useState("All Cities");
    const [lot, setLot] = useState("All Lots");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [toastMessage, setToastMessage] = useState("");

    const displayRegionalStats = useMemo(() => {
        if (region === "All Regions") return REGIONAL_AI_STATS;
        return REGIONAL_AI_STATS.filter(r => {
            if (region === "Addis Ababa" && r.code === "AA") return true;
            if (region === "Dire Dawa" && r.code === "DD") return true;
            if (region === "Oromia Region" && r.code === "OR") return true;
            if (region === "Sidama Region" && r.code === "SI") return true;
            return false;
        });
    }, [region]);

    const { trendData, donutData, confDistData, kpiStats } = useMemo(() => {
        let volMultiplier = 1;
        if (region !== "All Regions") volMultiplier *= 0.3;
        if (city !== "All Cities") volMultiplier *= 0.5;
        if (lot !== "All Lots") volMultiplier *= 0.1;

        let dataPoints = 7;
        let labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        if (timeRange === "24H") { dataPoints = 12; labels = Array.from({ length: 12 }, (_, i) => `${i * 2}h`); }
        else if (timeRange === "30D") { dataPoints = 15; labels = Array.from({ length: 15 }, (_, i) => `D${i * 2 + 1}`); }
        else if (timeRange === "YTD") { dataPoints = 12; labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; }

        let totalScans = 0, avgOcr = 0, avgInf = 0, avgLatency = 0;

        const trend = Array.from({ length: dataPoints }, (_, i) => {
            const scans = Math.floor((Math.random() * 5000 + 2000) * volMultiplier);
            const ocrConf = (Math.random() * 5 + 93).toFixed(1);
            const infTime = Math.floor(Math.random() * 40 + 110);
            const cpu = Math.floor(Math.random() * 30 + 40);
            const memory = Math.floor(Math.random() * 20 + 60);
            const latency = Math.floor(Math.random() * 100 + 200);
            const errorRate = parseFloat((Math.random() * 2).toFixed(2));
            totalScans += scans;
            avgOcr += parseFloat(ocrConf);
            avgInf += infTime;
            avgLatency += latency;
            return { label: labels[i], scans, ocrConf: parseFloat(ocrConf), infTime, cpu, memory, latency, errorRate };
        });

        avgOcr = (avgOcr / dataPoints).toFixed(1);
        avgInf = Math.floor(avgInf / dataPoints);
        avgLatency = Math.floor(avgLatency / dataPoints);
        const fps = Math.floor(1000 / avgInf);
        const activeNodes = displayRegionalStats.reduce((sum, r) => sum + r.nodes, 0);

        const donut = [
            { name: "Successful", value: Math.floor(totalScans * (avgOcr / 100)), color: "#10b981" },
            { name: "Failed", value: Math.floor(totalScans * (1 - (avgOcr / 100))), color: "#ef4444" }
        ];
        const confDist = [
            { bin: "0-60%", count: Math.floor(totalScans * 0.02) },
            { bin: "60-80%", count: Math.floor(totalScans * 0.08) },
            { bin: "80-90%", count: Math.floor(totalScans * 0.15) },
            { bin: "90-95%", count: Math.floor(totalScans * 0.25) },
            { bin: "95-100%", count: Math.floor(totalScans * 0.50) },
        ];

        return {
            trendData: trend,
            donutData: donut,
            confDistData: confDist,
            kpiStats: { scans: totalScans, ocr: avgOcr, inf: avgInf, fps, latency: avgLatency, activeNodes }
        };
    }, [timeRange, region, city, lot, displayRegionalStats]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 4000);
    };
    const closeDropdown = () => setActiveDropdown(null);

    const handleRegionSelect = (selectedRegion) => {
        let nextCity = "All Cities", nextLot = "All Lots";
        if (selectedRegion !== "All Regions") {
            const cities = CITIES_BY_REGION[selectedRegion] || [];
            if (cities.length === 1) {
                nextCity = cities[0];
                const lots = LOTS_BY_CITY[nextCity] || [];
                if (lots.length === 1) nextLot = lots[0];
            }
        }
        setRegion(selectedRegion); setCity(nextCity); setLot(nextLot);
        closeDropdown();
    };
    const handleCitySelect = (selectedCity) => {
        let nextLot = "All Lots";
        if (selectedCity !== "All Cities") {
            const lots = LOTS_BY_CITY[selectedCity] || [];
            if (lots.length === 1) nextLot = lots[0];
        }
        setCity(selectedCity); setLot(nextLot);
        closeDropdown();
    };

    const handleExport = () => {
        const csv = `Metric,Value\nAverage OCR Accuracy,${kpiStats.ocr}%\nYOLOv8 Inference Time (ms),${kpiStats.inf}\nActive Edge Nodes,${kpiStats.activeNodes}\nAPI Latency p95 (ms),${kpiStats.latency}\nFiltered Region,${region}\nFiltered City,${city}`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `VisionPark_AI_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("AI Analytics Report downloaded successfully!");
    };

    return (
        <div className="h-full w-full flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 relative pb-10 overflow-y-auto custom-scrollbar">

            {/* Toast */}
            {toastMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs md:text-sm px-6 py-3 rounded-2xl shadow-2xl z-[8000] animate-in slide-in-from-top-4 flex items-center gap-3 w-11/12 md:w-auto text-center justify-center">
                    <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0" /> {toastMessage}
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col gap-4 w-full shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Cpu className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" /> Platform Analytics
                        </h1>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">YOLOv8 edge performance, OCR accuracy, and system health.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-white dark:bg-[#18181b] p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm w-full md:w-auto">
                            {["24H", "7D", "30D", "YTD"].map(range => (
                                <button key={range} onClick={() => setTimeRange(range)}
                                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all outline-none cursor-pointer ${timeRange === range ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}>
                                    {range}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleExport}
                            className="hidden md:flex items-center justify-center h-10 w-10 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm outline-none cursor-pointer shrink-0">
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm w-full mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <DropdownTrigger label="Region" value={region} onClick={() => setActiveDropdown("region")} />
                        <DropdownTrigger label="City" value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown("city")} />
                        <DropdownTrigger label="Lot" value={lot} disabled={city === "All Cities"} onClick={() => setActiveDropdown("lot")} />
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0 mt-2">
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                        <Camera className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">OCR Accuracy (Avg)</p>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{kpiStats.ocr}%</h3>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                        <Zap className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Inference Time / FPS</p>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                        {kpiStats.inf} <span className="text-sm font-medium text-zinc-400">ms • {kpiStats.fps} FPS</span>
                    </h3>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <Server className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Active Edge Nodes</p>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                        {kpiStats.activeNodes} <span className="text-sm font-medium text-zinc-400">Devices</span>
                    </h3>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
                        <Gauge className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">API Latency (p95 Avg)</p>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                        {kpiStats.latency} <span className="text-sm font-medium text-zinc-400">ms</span>
                    </h3>
                </div>
            </div>

            {/* AI PROCESSING VOLUME + REGIONAL HEALTH */}
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 shrink-0">
                <div className="flex-[2] bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[350px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white">AI Processing Volume</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total Scans ({timeRange})</p>
                        </div>
                        <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                            {kpiStats.scans.toLocaleString()} <span className="text-xs font-bold text-zinc-400">Scans</span>
                        </h3>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ScansTooltip />} cursor={{ fill: "transparent" }} />
                                <Bar dataKey="scans" name="Total Scans" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[350px]">
                    <div className="flex items-center gap-2 mb-6 shrink-0">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white">Regional AI Health</h2>
                    </div>
                    <div className="flex flex-col gap-6 flex-1 justify-center overflow-y-auto custom-scrollbar">
                        {displayRegionalStats.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                                <Server className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-xs font-bold uppercase tracking-widest text-center">No Active Nodes<br />In Selected Region</p>
                            </div>
                        ) : (
                            displayRegionalStats.map((reg, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest">{reg.code}</span>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{reg.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white block">{reg.accuracy}% <span className="text-[10px] text-zinc-500">Acc</span></span>
                                            <span className="text-[10px] font-bold text-emerald-500">{reg.uptime} Uptime</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${reg.accuracy > 98 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${reg.accuracy}%` }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* SIX DETAIL CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 shrink-0 mt-2">

                {/* 1. YOLOv8 Inference Time */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">YOLOv8 Inference Time</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Milliseconds per frame</p>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<InferenceTooltip />} />
                                <Line type="monotone" dataKey="infTime" name="Inference (ms)" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Edge Node Resource Usage */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Edge Node Resource Usage</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">CPU vs Memory (%)</p>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ResourceTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "10px" }} />
                                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="memory" name="Memory %" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. OCR Extraction Success Donut */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-2 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">OCR Extraction Success</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total reads vs failures</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                <span className="text-3xl font-black text-zinc-900 dark:text-white">{kpiStats.ocr}%</span>
                                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-1">Success</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={donutData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none">
                                        {donutData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<OcrDonutTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-zinc-500">Successful</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="text-xs font-bold text-zinc-500">Failed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. AI Confidence Distribution */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">AI Confidence Distribution</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Number of scans per confidence bracket</p>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={confDistData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="bin" type="category" tick={{ fill: "#71717a", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} width={60} />
                                <Tooltip content={<ConfDistTooltip />} cursor={{ fill: "transparent" }} />
                                <Bar dataKey="count" name="Scans" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. OCR Confidence Trend */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">OCR Confidence Trend</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Average confidence (%) over time</p>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<OcrTrendTooltip />} />
                                <Line type="monotone" dataKey="ocrConf" name="OCR Conf %" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. API Latency & Error Rate */}
                <div className="bg-white dark:bg-[#121214] p-5 md:p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col min-h-[300px]">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">API Latency (p95)</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Network delay & failure rate</p>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<LatencyTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "10px" }} />
                                <Line yAxisId="left" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                                <Line yAxisId="right" type="monotone" dataKey="errorRate" name="Errors (%)" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* DROPDOWN MODALS */}
            {activeDropdown && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeDropdown} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50 dark:bg-[#121214]">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                                Select {activeDropdown === "region" ? "Region" : activeDropdown === "city" ? "City" : "Lot"}
                            </h2>
                            <button onClick={closeDropdown} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-3 md:p-4 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
                            {activeDropdown === "region" && REGION_GROUPS.map((group) => (
                                <div key={group.group} className="mb-3">
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-500">{group.group}</div>
                                    <div className="flex flex-col gap-1">
                                        {group.options.map(opt => (
                                            <button key={opt} onClick={() => handleRegionSelect(opt)}
                                                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${region === opt ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                                {opt} {region === opt && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {activeDropdown === "city" && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <button onClick={() => handleCitySelect("All Cities")}
                                        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${city === "All Cities" ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                        All Cities {city === "All Cities" && <Check className="h-4 w-4" />}
                                    </button>
                                    {CITIES_BY_REGION[region]?.filter(c => c !== "All Cities").map(opt => (
                                        <button key={opt} onClick={() => handleCitySelect(opt)}
                                            className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${city === opt ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                            {opt} {city === opt && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {activeDropdown === "lot" && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <button onClick={() => { setLot("All Lots"); closeDropdown(); }}
                                        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${lot === "All Lots" ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                        All Lots {lot === "All Lots" && <Check className="h-4 w-4" />}
                                    </button>
                                    {(LOTS_BY_CITY[city] || []).filter(c => c !== "All Lots").map(opt => (
                                        <button key={opt} onClick={() => { setLot(opt); closeDropdown(); }}
                                            className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${lot === opt ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                            {opt} {lot === opt && <Check className="h-4 w-4" />}
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