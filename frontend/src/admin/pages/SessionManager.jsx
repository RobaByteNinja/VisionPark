import React, { useState, useEffect, useMemo } from "react";
import {
    Users, ShieldAlert, Monitor, Smartphone, Globe,
    AlertTriangle, X, Trash2, CheckCircle, ChevronDown,
    Clock, Search, Shield, AlertOctagon, Activity, Eye, Check,
    MapPin
} from "lucide-react";

// ── LOCATION DATA (mirrors PlatformAnalytics) ─────────────────────────────────
const REGION_GROUPS = [
    { group: "NATIONAL", options: ["All Regions"] },
    { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
    { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];
const CITIES_BY_REGION = {
    "All Regions": ["All Cities"],
    "Addis Ababa": ["Addis Ababa"],
    "Dire Dawa": ["Dire Dawa"],
    "Oromia Region": ["Adama"],
    "Amhara Region": ["Bahir Dar"],
    "Tigray Region": ["Mekelle"],
    "Somali Region": ["Jigjiga"],
    "Sidama Region": ["Hawassa"],
};
const LOTS_BY_CITY = {
    "All Cities": ["All Lots"],
    "Addis Ababa": ["Bole Premium Lot", "Piazza Central", "Meskel Square Hub"],
    "Dire Dawa": ["Dire Dawa Central"],
    "Adama": ["Adama Terminal", "Stadium Parking"],
    "Bahir Dar": ["Lake Tana Parking"],
    "Mekelle": ["Mekelle City Parking"],
    "Jigjiga": ["Jigjiga Market Parking"],
    "Hawassa": ["Hawassa Park & Ride"],
};

// Assign every mock session a lot so the location filter actually works
const SESSION_LOTS = [
    "Bole Premium Lot", "Piazza Central", "Meskel Square Hub",
    "Dire Dawa Central", "Adama Terminal", "Lake Tana Parking",
    "Mekelle City Parking", "Jigjiga Market Parking", "Hawassa Park & Ride",
    "Bole Premium Lot", "Piazza Central", "Adama Terminal",
    "Meskel Square Hub", "Stadium Parking", "Bole Premium Lot",
];

// Reverse-lookup helpers so we can filter by region/city
const LOT_TO_CITY = {
    "Bole Premium Lot": "Addis Ababa", "Piazza Central": "Addis Ababa", "Meskel Square Hub": "Addis Ababa",
    "Dire Dawa Central": "Dire Dawa",
    "Adama Terminal": "Adama", "Stadium Parking": "Adama",
    "Lake Tana Parking": "Bahir Dar",
    "Mekelle City Parking": "Mekelle",
    "Jigjiga Market Parking": "Jigjiga",
    "Hawassa Park & Ride": "Hawassa",
};
const CITY_TO_REGION = {
    "Addis Ababa": "Addis Ababa", "Dire Dawa": "Dire Dawa",
    "Adama": "Oromia Region", "Bahir Dar": "Amhara Region",
    "Mekelle": "Tigray Region", "Jigjiga": "Somali Region",
    "Hawassa": "Sidama Region",
};

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const generateMockSessions = () => {
    const now = Date.now();
    const min = 60 * 1000;
    const hr = 60 * min;

    const raw = [
        { id: "SESS-9A2B", name: "Dawit Bekele", email: "owner@visionpark.et", role: "Owner", device: "MacBook Pro / Safari", type: "desktop", ip: "196.189.12.45", loginTime: now - 45 * min, isSuspicious: false },
        { id: "SESS-3C4D", name: "Kebede Alemu", email: "kebede.a@gmail.com", role: "Attendant", device: "Galaxy Tab S8 / App", type: "mobile", ip: "197.156.22.10", loginTime: now - 9.5 * hr, isSuspicious: true, suspiciousReason: "Duration > 8 hours" },
        { id: "SESS-7E8F", name: "Sara Tadesse", email: "sara.t@gmail.com", role: "Attendant", device: "iPad Air / App", type: "mobile", ip: "197.156.22.10", loginTime: now - 2.2 * hr, isSuspicious: false },
        { id: "SESS-1G2H", name: "Yonas Mengistu", email: "yonas.m@yahoo.com", role: "Driver", device: "iPhone 14 / App", type: "mobile", ip: "105.112.44.89", loginTime: now - 15 * min, isSuspicious: false },
        { id: "SESS-5I6J", name: "Hanna Tesfaye", email: "hanna.tesfaye@gmail.com", role: "Driver", device: "Windows PC / Chrome", type: "desktop", ip: "45.222.10.99", loginTime: now - 1.1 * hr, isSuspicious: true, suspiciousReason: "Unusual IP Location (VPN)" },
        { id: "SESS-9K0L", name: "Abebe Bikila", email: "abebe.b@gmail.com", role: "Driver", device: "Pixel 7 / App", type: "mobile", ip: "196.189.44.12", loginTime: now - 5 * min, isSuspicious: false },
        { id: "SESS-2M3N", name: "Betelhem Worku", email: "betty.w@hotmail.com", role: "Attendant", device: "Galaxy Tab A8 / App", type: "mobile", ip: "197.156.22.10", loginTime: now - 6.5 * hr, isSuspicious: false },
        { id: "SESS-4O5P", name: "Elias Kifle", email: "elias.k@gmail.com", role: "Driver", device: "iPhone 13 / Safari", type: "mobile", ip: "102.214.55.12", loginTime: now - 10.2 * hr, isSuspicious: true, suspiciousReason: "Duration > 8 hours" },
        { id: "SESS-6Q7R", name: "Meron Hailu", email: "meron.h@yahoo.com", role: "Driver", device: "MacBook Air / Chrome", type: "desktop", ip: "196.189.15.77", loginTime: now - 22 * min, isSuspicious: false },
        { id: "SESS-8S9T", name: "Samuel Derese", email: "samuel.d@gmail.com", role: "Driver", device: "Galaxy S21 / App", type: "mobile", ip: "105.112.33.41", loginTime: now - 3.4 * hr, isSuspicious: false },
        { id: "SESS-0U1V", name: "Lidetu Ayalew", email: "lidetu.a@gmail.com", role: "Driver", device: "Windows PC / Edge", type: "desktop", ip: "196.189.88.22", loginTime: now - 1.5 * hr, isSuspicious: false },
        { id: "SESS-2W3X", name: "Fasil Tekle", email: "fasil.t@gmail.com", role: "Attendant", device: "Lenovo Tablet / App", type: "mobile", ip: "197.156.22.10", loginTime: now - 4.8 * hr, isSuspicious: false },
        { id: "SESS-4Y5Z", name: "Tigist Assefa", email: "tigist.a@gmail.com", role: "Driver", device: "iPhone 12 / App", type: "mobile", ip: "102.214.66.33", loginTime: now - 42 * min, isSuspicious: false },
        { id: "SESS-6A7B", name: "Nahom Girma", email: "nahom.g@yahoo.com", role: "Driver", device: "Galaxy A53 / App", type: "mobile", ip: "105.112.99.11", loginTime: now - 2.8 * hr, isSuspicious: false },
        { id: "SESS-8C9D", name: "Mahlet Bekele", email: "mahlet.b@gmail.com", role: "Driver", device: "MacBook Pro / Safari", type: "desktop", ip: "196.189.12.45", loginTime: now - 12 * min, isSuspicious: false },
    ];

    // Attach a lot to each session (cycles through SESSION_LOTS)
    return raw.map((s, i) => ({ ...s, lot: SESSION_LOTS[i % SESSION_LOTS.length] }));
};

const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
};

// ── SHARED DROPDOWN TRIGGER ───────────────────────────────────────────────────
const DropdownTrigger = ({ value, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md"}`}
    >
        <span className="truncate pr-2 text-left">{value}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
    </button>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SessionManager() {
    const [sessions, setSessions] = useState(generateMockSessions());
    const [now, setNow] = useState(Date.now());

    // Location filters (same pattern as PlatformAnalytics)
    const [region, setRegion] = useState("All Regions");
    const [city, setCity] = useState("All Cities");
    const [lot, setLot] = useState("All Lots");
    const [activeDropdown, setActiveDropdown] = useState(null); // "region" | "city" | "lot" | null

    // Other filters
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Newest");
    const [isSortOpen, setIsSortOpen] = useState(false);

    // UI states
    const [confirmingId, setConfirmingId] = useState(null);
    const [terminatingIds, setTerminatingIds] = useState([]);
    const [expandedSession, setExpandedSession] = useState(null);

    // Terminate-all modal
    const [terminateAllModal, setTerminateAllModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isTerminatingAll, setIsTerminatingAll] = useState(false);

    // Live clock
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // ── LOCATION FILTER HANDLERS ─────────────────────────────────────────────
    const closeDropdown = () => setActiveDropdown(null);

    const handleRegionSelect = (sel) => {
        let nc = "All Cities", nl = "All Lots";
        if (sel !== "All Regions") {
            const cs = CITIES_BY_REGION[sel] || [];
            if (cs.length === 1) {
                nc = cs[0];
                const ls = LOTS_BY_CITY[nc] || [];
                if (ls.length === 1) nl = ls[0];
            }
        }
        setRegion(sel); setCity(nc); setLot(nl); closeDropdown();
    };

    const handleCitySelect = (sel) => {
        let nl = "All Lots";
        if (sel !== "All Cities") {
            const ls = LOTS_BY_CITY[sel] || [];
            if (ls.length === 1) nl = ls[0];
        }
        setCity(sel); setLot(nl); closeDropdown();
    };

    // ── ACTIONS ──────────────────────────────────────────────────────────────
    const handleTerminateSingle = (id) => {
        setConfirmingId(null);
        setTerminatingIds(prev => [...prev, id]);
        setTimeout(() => {
            setSessions(prev => prev.filter(s => s.id !== id));
            setTerminatingIds(prev => prev.filter(t => t !== id));
            if (expandedSession?.id === id) setExpandedSession(null);
        }, 300);
    };

    const handleTerminateAll = () => {
        setIsTerminatingAll(true);
        setTimeout(() => {
            setSessions([]);
            setTerminateAllModal(false);
            setIsTerminatingAll(false);
            setConfirmText("");
        }, 1500);
    };

    // ── DERIVED DATA ─────────────────────────────────────────────────────────
    const stats = {
        total: sessions.length,
        owner: sessions.filter(s => s.role === "Owner").length,
        attendant: sessions.filter(s => s.role === "Attendant").length,
        driver: sessions.filter(s => s.role === "Driver").length,
        suspicious: sessions.filter(s => s.isSuspicious).length,
    };

    const filteredSessions = useMemo(() => {
        let result = sessions.filter(s => {
            // ── location filter ──
            if (lot !== "All Lots" && s.lot !== lot) return false;
            if (city !== "All Cities" && LOT_TO_CITY[s.lot] !== city) return false;
            if (region !== "All Regions") {
                const sessionRegion = CITY_TO_REGION[LOT_TO_CITY[s.lot]];
                // For federal cities the region key equals the city name
                const effectiveRegion = sessionRegion === region || LOT_TO_CITY[s.lot] === region;
                if (!effectiveRegion) return false;
            }
            // ── text / role filter ──
            const matchesSearch =
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "All" || s.role === roleFilter;
            return matchesSearch && matchesRole;
        });

        if (sortBy === "Newest") result.sort((a, b) => b.loginTime - a.loginTime);
        if (sortBy === "Longest") result.sort((a, b) => a.loginTime - b.loginTime);
        return result;
    }, [sessions, searchQuery, roleFilter, sortBy, region, city, lot]);

    const suspiciousSessions = sessions.filter(s => s.isSuspicious);

    const isLocationFiltered = region !== "All Regions" || city !== "All Cities" || lot !== "All Lots";

    const locationLabel = lot !== "All Lots" ? lot
        : city !== "All Cities" ? city
            : region !== "All Regions" ? region
                : null;

    // ── HELPERS ───────────────────────────────────────────────────────────────
    const getRoleBadge = (role) => {
        if (role === "Owner") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
        if (role === "Attendant") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    };

    const Sparkline = ({ percent, colorClass }) => (
        <div className="flex gap-1 h-6 items-end opacity-80 mt-1">
            <div className={`w-1.5 rounded-t-sm ${colorClass}`} style={{ height: `${percent * 0.4}%` }} />
            <div className={`w-1.5 rounded-t-sm ${colorClass}`} style={{ height: `${percent * 0.7}%` }} />
            <div className={`w-1.5 rounded-t-sm ${colorClass}`} style={{ height: `${percent}%` }} />
        </div>
    );

    // Shared dropdown list item
    const DItem = ({ label, active, onClick }) => (
        <button onClick={onClick}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer
                ${active
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm"
                    : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                }`}>
            {label} {active && <Check className="h-4 w-4 shrink-0" />}
        </button>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10">

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Users className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500 shrink-0" />
                        Session Manager
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Monitor and terminate active sessions across all roles.</p>
                </div>
                <button
                    onClick={() => setTerminateAllModal(true)}
                    disabled={sessions.length === 0}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-5 py-2.5 rounded-xl font-bold transition-all outline-none active:scale-95 disabled:opacity-50 shrink-0"
                >
                    <AlertOctagon className="h-4 w-4" /> Terminate All Sessions
                </button>
            </div>

            {/* 2. LOCATION FILTER CARD */}
            <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Filter by Location</span>
                    {isLocationFiltered && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                                {locationLabel}
                            </span>
                            <button
                                onClick={() => { setRegion("All Regions"); setCity("All Cities"); setLot("All Lots"); }}
                                className="p-1 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors outline-none"
                                title="Clear location filter"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <DropdownTrigger value={region} onClick={() => setActiveDropdown("region")} />
                    <DropdownTrigger value={city} disabled={region === "All Regions"} onClick={() => setActiveDropdown("city")} />
                    <DropdownTrigger value={lot} disabled={city === "All Cities"} onClick={() => setActiveDropdown("lot")} />
                </div>
            </div>

            {/* 3. SESSION SUMMARY CARDS */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Active</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <Activity className="h-5 w-5 text-zinc-400 mb-2" />
                        <Sparkline percent={100} colorClass="bg-zinc-300 dark:bg-zinc-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Owner</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white">{stats.owner}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <Shield className="h-5 w-5 text-indigo-400 mb-2" />
                        <Sparkline percent={Math.max((stats.owner / Math.max(stats.total, 1)) * 100, 20)} colorClass="bg-indigo-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Attendants</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white">{stats.attendant}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <Users className="h-5 w-5 text-amber-400 mb-2" />
                        <Sparkline percent={Math.max((stats.attendant / Math.max(stats.total, 1)) * 100, 20)} colorClass="bg-amber-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Drivers</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white">{stats.driver}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <Smartphone className="h-5 w-5 text-emerald-400 mb-2" />
                        <Sparkline percent={Math.max((stats.driver / Math.max(stats.total, 1)) * 100, 20)} colorClass="bg-emerald-400" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 relative">

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* 4. FILTER BAR — role tabs + search + sort */}
                    <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">

                        {/* Role tabs */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {["All", "Owner", "Attendant", "Driver"].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all outline-none flex-1 md:flex-none text-center
                                        ${roleFilter === role
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md"
                                            : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Search + Sort */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search user or ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center justify-between gap-2 pl-4 pr-3 py-2 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none hover:border-indigo-500 transition-colors w-36"
                                >
                                    <span>Sort: {sortBy}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                                </button>
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsSortOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-1.5 flex flex-col">
                                                {["Newest", "Longest"].map(opt => (
                                                    <button key={opt} onClick={() => { setSortBy(opt); setIsSortOpen(false); }}
                                                        className={`px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors outline-none ${sortBy === opt ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location-filtered result count */}
                    {isLocationFiltered && (
                        <div className="flex items-center gap-2 px-1 animate-in fade-in duration-200">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="text-xs font-bold text-zinc-500">
                                Showing <span className="text-indigo-600 dark:text-indigo-400">{filteredSessions.length}</span> session{filteredSessions.length !== 1 ? "s" : ""} at <span className="text-zinc-900 dark:text-white">{locationLabel}</span>
                            </span>
                        </div>
                    )}

                    {/* 5. SESSIONS TABLE */}
                    <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                        <div className="overflow-x-auto w-full custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse min-w-[920px]">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-black/20">
                                        <th className="px-5 py-4 font-black">Session ID</th>
                                        <th className="px-5 py-4 font-black">User</th>
                                        <th className="px-5 py-4 font-black">Role</th>
                                        <th className="px-5 py-4 font-black">Device</th>
                                        <th className="px-5 py-4 font-black">Lot / IP</th>
                                        <th className="px-5 py-4 font-black">Duration (Live)</th>
                                        <th className="px-5 py-4 font-black text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredSessions.length > 0 ? filteredSessions.map(session => {
                                        const isTerminating = terminatingIds.includes(session.id);
                                        const isConfirming = confirmingId === session.id;
                                        return (
                                            <tr
                                                key={session.id}
                                                className={`border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all duration-300
                                                    ${isTerminating ? "opacity-0 translate-x-4 scale-[0.98]" : "opacity-100 translate-x-0 scale-100"}
                                                    ${session.isSuspicious ? "bg-red-50/30 dark:bg-red-500/5" : ""}
                                                `}
                                            >
                                                <td className="px-5 py-4 font-mono font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{session.id}</td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-zinc-900 dark:text-white">{session.name}</div>
                                                    <div className="text-[10px] text-zinc-500">{session.email}</div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getRoleBadge(session.role)}`}>
                                                        {session.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium text-xs">
                                                        {session.type === "desktop" ? <Monitor className="h-4 w-4 shrink-0" /> : <Smartphone className="h-4 w-4 shrink-0" />}
                                                        {session.device}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {/* Show lot name and IP stacked */}
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                        <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span className="truncate max-w-[120px]">{session.lot}</span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{session.ip}</div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className={`font-mono font-bold flex items-center gap-1.5 ${session.isSuspicious ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                        <Clock className="h-3.5 w-3.5 opacity-70" />
                                                        {formatDuration(now - session.loginTime)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right">
                                                    {isConfirming ? (
                                                        <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                                            <button onClick={() => setConfirmingId(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors outline-none">Cancel</button>
                                                            <button onClick={() => handleTerminateSingle(session.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors outline-none">Confirm Kill</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setConfirmingId(session.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all outline-none">
                                                            Terminate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="7" className="px-5 py-10 text-center text-zinc-500">
                                                <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold text-zinc-400">
                                                    {isLocationFiltered ? `No sessions found at ${locationLabel}.` : "No active sessions found."}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 6. SUSPICIOUS ACTIVITY PANEL */}
                <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
                    <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-red-700 dark:text-red-400 leading-tight">Security Flags</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 mt-1">
                                {stats.suspicious} Suspicious {stats.suspicious === 1 ? "Session" : "Sessions"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Flagged Activity</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {suspiciousSessions.length > 0 ? suspiciousSessions.map(session => (
                                <div key={`susp-${session.id}`} className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-3 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-zinc-900 dark:text-white truncate pr-2">{session.name}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 shrink-0">Review</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono mb-2">{session.id}</p>
                                    <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-100 dark:border-red-500/20 mb-3">
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400">{session.suspiciousReason}</p>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <button
                                            onClick={() => setExpandedSession(expandedSession?.id === session.id ? null : session)}
                                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors outline-none flex items-center justify-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" /> {expandedSession?.id === session.id ? "Hide" : "Details"}
                                        </button>
                                        <button
                                            onClick={() => handleTerminateSingle(session.id)}
                                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors outline-none"
                                        >
                                            Kill Session
                                        </button>
                                    </div>
                                    {expandedSession?.id === session.id && (
                                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/10 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex justify-between"><span className="text-zinc-500 font-bold">Role:</span>     <span className="text-zinc-900 dark:text-white font-medium">{session.role}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500 font-bold">Lot:</span>      <span className="text-zinc-900 dark:text-white truncate max-w-[130px] text-right">{session.lot}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500 font-bold">IP:</span>       <span className="text-zinc-900 dark:text-white font-mono">{session.ip}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500 font-bold">Device:</span>   <span className="text-zinc-900 dark:text-white truncate max-w-[120px] text-right">{session.device}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500 font-bold">Duration:</span> <span className="text-red-500 font-mono font-bold">{formatDuration(now - session.loginTime)}</span></div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-center h-full">
                                    <CheckCircle className="h-8 w-8 mb-2 text-emerald-500 opacity-50" />
                                    <p className="text-xs font-bold">No suspicious activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TERMINATE ALL MODAL ── */}
            {terminateAllModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setTerminateAllModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mb-6">
                            <AlertOctagon className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-2">Emergency Override</h2>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            You are about to instantly terminate <span className="font-bold text-red-500">{sessions.length} active sessions</span>. This will force all users to log in again. Type <strong className="text-zinc-900 dark:text-white font-mono">CONFIRM</strong> to proceed.
                        </p>
                        <input
                            type="text" value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder="Type CONFIRM"
                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-center text-sm font-mono font-black text-zinc-900 dark:text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all mb-6 uppercase"
                            autoFocus
                        />
                        <div className="flex w-full gap-3">
                            <button onClick={() => { setTerminateAllModal(false); setConfirmText(""); }} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95">
                                Cancel
                            </button>
                            <button onClick={handleTerminateAll} disabled={confirmText !== "CONFIRM" || isTerminatingAll}
                                className="flex-[1.5] py-3.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
                                {isTerminatingAll
                                    ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Trash2 className="h-4 w-4" />}
                                {isTerminatingAll ? "Terminating..." : "Kill All Sessions"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LOCATION DROPDOWN MODAL (same pattern as PlatformAnalytics) ── */}
            {activeDropdown && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeDropdown} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">

                        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50 dark:bg-[#121214]">
                            <h2 className="text-base md:text-lg font-black text-zinc-900 dark:text-white">
                                Select {activeDropdown === "region" ? "Region" : activeDropdown === "city" ? "City" : "Lot"}
                            </h2>
                            <button onClick={closeDropdown} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-3 md:p-4 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">

                            {activeDropdown === "region" && REGION_GROUPS.map(g => (
                                <div key={g.group} className="mb-3">
                                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-500">{g.group}</div>
                                    <div className="flex flex-col gap-1">
                                        {g.options.map(o => <DItem key={o} label={o} active={region === o} onClick={() => handleRegionSelect(o)} />)}
                                    </div>
                                </div>
                            ))}

                            {activeDropdown === "city" && (
                                <div className="flex flex-col gap-1 mt-1">
                                    {["All Cities", ...(CITIES_BY_REGION[region]?.filter(c => c !== "All Cities") || [])].map(o => (
                                        <DItem key={o} label={o} active={city === o} onClick={() => handleCitySelect(o)} />
                                    ))}
                                </div>
                            )}

                            {activeDropdown === "lot" && (
                                <div className="flex flex-col gap-1 mt-1">
                                    {["All Lots", ...(LOTS_BY_CITY[city] || []).filter(l => l !== "All Lots")].map(o => (
                                        <DItem key={o} label={o} active={lot === o} onClick={() => { setLot(o); closeDropdown(); }} />
                                    ))}
                                </div>
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