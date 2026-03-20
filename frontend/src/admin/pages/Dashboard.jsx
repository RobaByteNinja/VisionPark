import React, { useState, useEffect, useMemo } from "react";
import {
    ShieldAlert, Car, Server, Activity, AlertTriangle,
    Clock, Cpu, HardDrive, MapPin, CheckCircle,
    XCircle, ChevronDown, Map, Building, X, Check
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";

// --- LOCATION DATA STRUCTURES ---
const REGION_GROUPS = [
    { group: "NATIONAL", options: ["All Regions"] },
    { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
    { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];

const CITIES_BY_REGION = {
    "All Regions": ["All Cities"],
    "Addis Ababa": ["All Cities", "Addis Ababa"],
    "Dire Dawa": ["All Cities", "Dire Dawa"],
    "Oromia Region": ["All Cities", "Adama"],
    "Amhara Region": ["All Cities", "Bahir Dar"],
    "Tigray Region": ["All Cities", "Mekelle"],
    "Somali Region": ["All Cities", "Jigjiga"],
    "Sidama Region": ["All Cities", "Hawassa"]
};

const BRANCHES_BY_CITY = {
    "All Cities": ["All Branches"],
    "Addis Ababa": ["All Branches", "Bole Airport", "Piazza", "Meskel Square"],
    "Dire Dawa": ["All Branches", "DD Central"],
    "Adama": ["All Branches", "Adama Terminal"],
    "Bahir Dar": ["All Branches", "Lake Side"],
    "Mekelle": ["All Branches", "City Center"],
    "Jigjiga": ["All Branches", "Market Parking"],
    "Hawassa": ["All Branches", "Park & Ride"]
};

// --- MOCK SYSTEM DATA ---
const CHART_DATA = [
    { time: "00:00", cpu: 22, memory: 45 },
    { time: "02:00", cpu: 18, memory: 44 },
    { time: "04:00", cpu: 15, memory: 43 },
    { time: "06:00", cpu: 25, memory: 48 },
    { time: "08:00", cpu: 55, memory: 60 },
    { time: "10:00", cpu: 78, memory: 72 },
    { time: "12:00", cpu: 85, memory: 78 },
    { time: "14:00", cpu: 82, memory: 76 },
    { time: "16:00", cpu: 75, memory: 70 },
    { time: "18:00", cpu: 65, memory: 65 },
    { time: "20:00", cpu: 45, memory: 55 },
    { time: "22:00", cpu: 30, memory: 50 },
    { time: "23:59", cpu: 25, memory: 48 },
];

const NODES = [
    { id: "AA-01", region: "Addis Ababa", city: "Addis Ababa", branch: "Bole Airport", status: "Online", ping: "12ms", uptime: "99.9%" },
    { id: "AA-02", region: "Addis Ababa", city: "Addis Ababa", branch: "Piazza", status: "Online", ping: "14ms", uptime: "99.8%" },
    { id: "AA-03", region: "Addis Ababa", city: "Addis Ababa", branch: "Meskel Square", status: "Warning", ping: "150ms", uptime: "99.5%" },
    { id: "DD-01", region: "Dire Dawa", city: "Dire Dawa", branch: "DD Central", status: "Offline", ping: "-", uptime: "98.2%" },
    { id: "AD-01", region: "Oromia Region", city: "Adama", branch: "Adama Terminal", status: "Online", ping: "18ms", uptime: "99.9%" },
    { id: "BD-01", region: "Amhara Region", city: "Bahir Dar", branch: "Lake Side", status: "Online", ping: "22ms", uptime: "99.9%" },
    { id: "HW-01", region: "Sidama Region", city: "Hawassa", branch: "Park & Ride", status: "Online", ping: "19ms", uptime: "99.9%" },
];

const EVENTS = [
    { id: 1, time: "10:45 AM", type: "Connection Lost", node: "DD-01", severity: "CRITICAL", message: "Edge node stopped responding to heartbeat pings." },
    { id: 2, time: "10:30 AM", type: "High Latency", node: "AA-03", severity: "WARNING", message: "Network latency exceeded 100ms threshold." },
    { id: 3, time: "09:00 AM", type: "DB Backup", node: "Global-DB", severity: "INFO", message: "Automated incremental backup completed successfully." },
    { id: 4, time: "08:15 AM", type: "AI Model Sync", node: "All Nodes", severity: "INFO", message: "YOLOv8 weights synchronized across edge fleet." },
    { id: 5, time: "07:30 AM", type: "Auth Gateway", node: "API-01", severity: "WARNING", message: "Elevated rate of failed 2FA attempts detected." },
    { id: 6, time: "06:05 AM", type: "System Boot", node: "AD-01", severity: "INFO", message: "Node successfully completed scheduled reboot." },
    { id: 7, time: "04:00 AM", type: "Storage Purge", node: "Global-Storage", severity: "INFO", message: "Cleared 12GB of orphaned inference snapshots." },
    { id: 8, time: "01:20 AM", type: "Firmware Update", node: "HW-01", severity: "INFO", message: "Camera firmware updated to v2.1.4." },
];

// --- CUSTOM TOOLTIP FOR RECHARTS ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1c1c1f] border border-[#3f3f46] p-4 rounded-xl shadow-xl z-50">
                <p className="text-zinc-300 text-sm font-bold mb-3">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 mb-1.5 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm font-medium text-zinc-100 w-16">{entry.name}:</span>
                        <span className="text-sm font-black" style={{ color: entry.color }}>{entry.value}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [selectedNode, setSelectedNode] = useState(null);

    // --- FILTER STATE ---
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [filters, setFilters] = useState({
        region: "All Regions",
        city: "All Cities",
        branch: "All Branches"
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- DERIVED / FILTERED DATA ---
    const filteredNodes = useMemo(() => {
        return NODES.filter(n => {
            const matchRegion = filters.region === "All Regions" || n.region === filters.region;
            const matchCity = filters.city === "All Cities" || n.city === filters.city;
            const matchBranch = filters.branch === "All Branches" || n.branch === filters.branch;
            return matchRegion && matchCity && matchBranch;
        });
    }, [filters]);

    const filteredEvents = useMemo(() => {
        const nodeIds = filteredNodes.map(n => n.id);
        return EVENTS.filter(e =>
            nodeIds.includes(e.node) ||
            e.node === "Global-DB" ||
            e.node === "All Nodes" ||
            e.node === "Global-Storage" ||
            e.node === "API-01"
        );
    }, [filteredNodes]);

    // Dynamic KPIs based on filters
    const kpiSessions = filteredNodes.length * 208; // Mock active sessions per node
    const kpiOnlineNodes = filteredNodes.filter(n => n.status === "Online").length;
    const kpiCriticalAlerts = filteredNodes.filter(n => n.status === "Offline" || n.status === "Warning").length;

    const getNodeStatusStyles = (status) => {
        if (status === "Online") return { text: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", icon: <CheckCircle className="h-4 w-4" /> };
        if (status === "Warning") return { text: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", icon: <AlertTriangle className="h-4 w-4" /> };
        return { text: "text-red-500", bg: "bg-red-100 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20", icon: <XCircle className="h-4 w-4" /> };
    };

    const getSeverityStyles = (severity) => {
        if (severity === "INFO") return "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300";
        if (severity === "WARNING") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
    };

    const DropdownTrigger = ({ icon: Icon, label, value, onClick, disabled }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer'}`}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="truncate font-bold">{value}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
        </button>
    );

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

            {/* 1. HEADER & GLOBAL FILTERS */}
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                            <ShieldAlert className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500" />
                            System Dashboard
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live infrastructure overview and health telemetry.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm text-zinc-600 dark:text-zinc-300 font-bold text-sm shrink-0">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        <span className="font-mono tracking-wide">{currentTime}</span>
                    </div>
                </div>

                {/* Filter Navigation Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full bg-white dark:bg-[#121214] p-3 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm relative z-40">
                    <DropdownTrigger icon={Map} label="Region" value={filters.region} onClick={() => setActiveDropdown('region')} />
                    <DropdownTrigger icon={MapPin} label="City" value={filters.city} onClick={() => setActiveDropdown('city')} disabled={filters.region === "All Regions"} />
                    <DropdownTrigger icon={Building} label="Branch" value={filters.branch} onClick={() => setActiveDropdown('branch')} disabled={filters.city === "All Cities"} />
                </div>
            </div>

            {/* 2. KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 shrink-0 relative z-10">
                <div className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Active Sessions</p>
                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Car className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-zinc-900 dark:text-white">{kpiSessions.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-widest">In Selected Scope</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Online Edge Nodes</p>
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Server className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-zinc-900 dark:text-white">{kpiOnlineNodes}</p>
                            <p className="text-sm font-bold text-zinc-500">/ {filteredNodes.length}</p>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">{filteredNodes.length > 0 ? Math.round((kpiOnlineNodes / filteredNodes.length) * 100) : 0}% Capacity</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">System Uptime</p>
                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Activity className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-zinc-900 dark:text-white">99.9%</p>
                        <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-widest">Trailing 30 Days</p>
                    </div>
                </div>

                <div className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors ${kpiCriticalAlerts > 0 ? 'bg-white dark:bg-[#121214] border-red-200 dark:border-red-500/20' : 'bg-white dark:bg-[#121214] border-zinc-200 dark:border-white/5'}`}>
                    {kpiCriticalAlerts > 0 && <div className="absolute inset-0 bg-red-50 dark:bg-red-500/5 pointer-events-none"></div>}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className={`text-xs font-bold uppercase tracking-widest ${kpiCriticalAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}>Critical Alerts</p>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${kpiCriticalAlerts > 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className={`text-3xl font-black ${kpiCriticalAlerts > 0 ? 'text-red-600 dark:text-red-500' : 'text-zinc-900 dark:text-white'}`}>{kpiCriticalAlerts}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${kpiCriticalAlerts > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{kpiCriticalAlerts > 0 ? 'Requires Attention' : 'All Systems Nominal'}</p>
                    </div>
                </div>
            </div>

            {/* 3 & 4. CHARTS AND NODE MAP */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 relative z-10">

                {/* Infrastructure Health Chart */}
                <div className="xl:col-span-2 bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-indigo-500" /> Resource Utilization
                            </h2>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">CPU & Memory (Last 24h)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                <div className="w-3 h-3 rounded bg-[#ef4444]"></div> CPU
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                <div className="w-3 h-3 rounded bg-[#818cf8]"></div> RAM
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} opacity={0.2} />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    domain={[0, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area type="monotone" dataKey="memory" name="Memory" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorMem)" activeDot={{ r: 6, fill: '#818cf8', stroke: '#121214', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="cpu" name="CPU" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" activeDot={{ r: 6, fill: '#ef4444', stroke: '#121214', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Node Status Map */}
                <div className="bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-500" /> Edge Node Map
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-1 max-h-[300px] xl:max-h-none flex-1">
                        {filteredNodes.length > 0 ? filteredNodes.map((node) => {
                            const styles = getNodeStatusStyles(node.status);
                            const isSelected = selectedNode === node.id;

                            return (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 outline-none ${isSelected ? 'border-indigo-500 shadow-md bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-white/20'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="font-mono font-black text-zinc-900 dark:text-white tracking-wider">{node.id}</span>
                                            <p className="text-xs font-bold text-zinc-500 mt-0.5">{node.city}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.bg} ${styles.text} ${styles.border} border`}>
                                            {styles.icon} {node.status}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-200 dark:border-white/5">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Ping</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{node.ping}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Uptime</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{node.uptime}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 h-full">
                                <Server className="h-10 w-10 mb-3 opacity-20" />
                                <p className="text-sm font-bold text-zinc-400">No nodes found in this scope.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. RECENT SYSTEM EVENTS */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col shrink-0 relative z-10">
                <div className="p-5 md:p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-indigo-500" /> Recent System Events
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1">Platform-wide infrastructure logs</p>
                    </div>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-black/20">
                                <th className="px-6 py-4 font-black">Timestamp</th>
                                <th className="px-6 py-4 font-black">Severity</th>
                                <th className="px-6 py-4 font-black">Event Type</th>
                                <th className="px-6 py-4 font-black">Node/Service</th>
                                <th className="px-6 py-4 font-black">Message</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <tr key={event.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-medium text-zinc-500 whitespace-nowrap">{event.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getSeverityStyles(event.severity)}`}>
                                            {event.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{event.type}</td>
                                    <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{event.node}</td>
                                    <td className="px-6 py-4 font-medium text-zinc-600 dark:text-zinc-400 max-w-[400px] truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors">
                                        {event.message}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-zinc-500">
                                        No events found for the selected scope.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- OVERLAY DROPDOWN MENUS WITH AUTO-FILL LOGIC --- */}
            {activeDropdown && (
                <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setActiveDropdown(null)}></div>

                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-zinc-200 dark:border-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                {activeDropdown === 'region' ? <Map className="h-5 w-5 text-indigo-500" /> : activeDropdown === 'city' ? <MapPin className="h-5 w-5 text-indigo-500" /> : <Building className="h-5 w-5 text-indigo-500" />}
                                Select {activeDropdown === 'region' ? 'Region' : activeDropdown === 'city' ? 'City' : 'Branch'}
                            </h2>
                            <button type="button" onClick={() => setActiveDropdown(null)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors outline-none"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                            {/* REGION SELECTION (With Auto-Fill) */}
                            {activeDropdown === 'region' && REGION_GROUPS.map((group) => (
                                <div key={group.group} className="mb-2">
                                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{group.group}</div>
                                    <div className="flex flex-col gap-1">
                                        {group.options.map(opt => (
                                            <button
                                                type="button" key={opt}
                                                onClick={() => {
                                                    let targetCity = "All Cities";
                                                    let targetBranch = "All Branches";

                                                    // SMART AUTO-FILL LOGIC
                                                    if (opt !== "All Regions") {
                                                        const availableCities = CITIES_BY_REGION[opt] || [];
                                                        // If length is 2, it means ["All Cities", "Specific City"]
                                                        if (availableCities.length === 2) {
                                                            targetCity = availableCities[1];
                                                            const availableBranches = BRANCHES_BY_CITY[targetCity] || [];
                                                            if (availableBranches.length === 2) {
                                                                targetBranch = availableBranches[1];
                                                            }
                                                        }
                                                    }

                                                    setFilters({ ...filters, region: opt, city: targetCity, branch: targetBranch });
                                                    setActiveDropdown(null);
                                                }}
                                                className={`flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between transition-colors outline-none ${filters.region === opt ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'}`}
                                            >
                                                {opt} {filters.region === opt && <Check className="h-4 w-4 text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* CITY SELECTION (With Auto-Fill) */}
                            {activeDropdown === 'city' && CITIES_BY_REGION[filters.region]?.map(opt => (
                                <button
                                    type="button" key={opt}
                                    onClick={() => {
                                        let targetBranch = "All Branches";

                                        // SMART AUTO-FILL LOGIC
                                        if (opt !== "All Cities") {
                                            const availableBranches = BRANCHES_BY_CITY[opt] || [];
                                            if (availableBranches.length === 2) {
                                                targetBranch = availableBranches[1];
                                            }
                                        }

                                        setFilters({ ...filters, city: opt, branch: targetBranch });
                                        setActiveDropdown(null);
                                    }}
                                    className={`flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between transition-colors outline-none mt-1 ${filters.city === opt ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'}`}
                                >
                                    {opt} {filters.city === opt && <Check className="h-4 w-4 text-indigo-500" />}
                                </button>
                            ))}

                            {/* BRANCH SELECTION */}
                            {activeDropdown === 'branch' && (
                                BRANCHES_BY_CITY[filters.city]?.length > 0 ? (
                                    BRANCHES_BY_CITY[filters.city].map(opt => (
                                        <button
                                            type="button" key={opt}
                                            onClick={() => {
                                                setFilters({ ...filters, branch: opt });
                                                setActiveDropdown(null);
                                            }}
                                            className={`flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between transition-colors outline-none mt-1 ${filters.branch === opt ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'}`}
                                        >
                                            {opt} {filters.branch === opt && <Check className="h-4 w-4 text-indigo-500" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-zinc-500 text-center">No branches configured for this city.</div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
            `}</style>
        </div>
    );
}