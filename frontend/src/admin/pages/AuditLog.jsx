import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    ScrollText, Download, FileSpreadsheet, Search,
    Filter, ChevronLeft, ChevronRight, X, User,
    Cpu, Server, Car, CreditCard, ShieldAlert,
    Info, AlertTriangle, XCircle, CheckCircle,
    Clock, MapPin, Database, ChevronDown, RefreshCw, Check
} from "lucide-react";

// ── VEHICLE CATEGORY DATA ─────────────────────────────────────────────────────
const VEHICLE_CATEGORY_GROUPS = [
    {
        group: "Public Transport",
        options: [
            "Public Transport Vehicles | Upto 12 Seats",
            "Public Transport Vehicles | 13-24 Seats",
            "Public Transport Vehicles | 25 Seats and above",
        ],
    },
    {
        group: "Two Wheelers",
        options: [
            "Bicycle | Bicycle",
            "Motorcycle | Motorcycle",
        ],
    },
    {
        group: "Dry Freight",
        options: [
            "Dry Freight Vehicles | <35 Quintal",
            "Dry Freight Vehicles | 36-70 Quintal",
            "Dry Freight Vehicles | >71 Quintal",
        ],
    },
    {
        group: "Liquid Cargo",
        options: [
            "Liquid Cargo Vehicles | Upto 28 Liter",
            "Liquid Cargo Vehicles | Above 28 Liter",
        ],
    },
    {
        group: "Machineries",
        options: [
            "Machineries | Upto 5000KG weight",
            "Machineries | 5001-10,000KG weight",
            "Machineries | Above 10,001KG weight",
        ],
    },
];

// All options flat (used for filter matching)
const ALL_VEHICLE_OPTIONS = VEHICLE_CATEGORY_GROUPS.flatMap(g => g.options);

// Short group label extracted from a full option string
const getGroupLabel = (option) => {
    for (const g of VEHICLE_CATEGORY_GROUPS) {
        if (g.options.includes(option)) return g.group;
    }
    return null;
};

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const generateMockLogs = () => {
    const logs = [];
    const now = new Date();

    const actors = [
        { name: "System Admin", role: "Admin" }, // 0
        { name: "Dawit Bekele", role: "Owner" }, // 1
        { name: "Kebede Alemu", role: "Attendant" }, // 2
        { name: "Sara Tadesse", role: "Attendant" }, // 3
        { name: "VisionPark Engine", role: "AI System" }, // 4
        { name: "Yonas Mengistu", role: "Driver" }, // 5
        { name: "Betelhem Worku", role: "Driver" }, // 6
    ];

    // vehicleCategory is set on Vehicle-category entries where it's relevant
    const scenarios = [
        { actor: 0, cat: "Auth", sev: "Warning", status: "Success", desc: "Forced termination of active session for Kebede Alemu.", meta: { sessionId: "SESS-3C4D", reason: "Overtime limit exceeded" } },
        { actor: 5, cat: "Financial", sev: "Info", status: "Success", desc: "Driver processed digital payment via Telebirr.", meta: { amount: 45, ref: "TB-99182A", plate: "OR 12904" }, vehicleCategory: "Public Transport Vehicles | Upto 12 Seats" },
        { actor: 0, cat: "Config", sev: "Info", status: "Success", desc: "Updated global AI OCR confidence threshold.", meta: { before: { ocrThreshold: 80 }, after: { ocrThreshold: 85 } } },
        { actor: 6, cat: "Vehicle", sev: "Info", status: "Success", desc: "Driver registered a new vehicle profile.", meta: { plate: "AA 88392", type: "Private" }, vehicleCategory: "Dry Freight Vehicles | <35 Quintal" },
        { actor: 0, cat: "Auth", sev: "Critical", status: "Failed", desc: "Failed master admin login attempt. Invalid 2FA token.", meta: { attempts: 3, lockout: false } },
        { actor: 1, cat: "Config", sev: "Info", status: "Success", desc: "Created new parking branch 'Bole Airport Premium'.", meta: { branchId: "BR-04", capacity: 150 } },
        { actor: 5, cat: "Vehicle", sev: "Warning", status: "Success", desc: "Driver extended active parking session by 1 hour.", meta: { sessionId: "RSV-112", additionalFee: 20 }, vehicleCategory: "Motorcycle | Motorcycle" },
        { actor: 1, cat: "Financial", sev: "Warning", status: "Success", desc: "Modified base hourly rate for 'Public Transport'.", meta: { before: { rate: 30 }, after: { rate: 45 } } },
        { actor: 6, cat: "Auth", sev: "Info", status: "Success", desc: "Driver logged into the mobile application.", meta: { device: "iPhone 14", os: "iOS 17" } },
        { actor: 1, cat: "Auth", sev: "Info", status: "Success", desc: "Added new attendant 'Sara Tadesse' to branch Piazza.", meta: { attendantId: "OP-4491" } },
        { actor: 2, cat: "Vehicle", sev: "Info", status: "Success", desc: "Processed Walk-Up cash deposit for plate AA 45892.", meta: { amount: 60, duration: "2h" }, vehicleCategory: "Public Transport Vehicles | 13-24 Seats" },
        { actor: 2, cat: "Vehicle", sev: "Warning", status: "Success", desc: "Manual override: Unclamped vehicle OR 12904 after fine collection.", meta: { fineCollected: 800 }, vehicleCategory: "Liquid Cargo Vehicles | Upto 28 Liter" },
        { actor: 3, cat: "Vehicle", sev: "Info", status: "Success", desc: "Logged customer dispute regarding penalty fee.", meta: { incidentId: "INC-991", plate: "UN 90112" }, vehicleCategory: "Dry Freight Vehicles | 36-70 Quintal" },
        { actor: 4, cat: "Node", sev: "Critical", status: "Failed", desc: "Edge Node DD-01 stopped responding to heartbeat. Marked offline.", meta: { lastPing: "14:02:11", timeout: "30000ms" } },
        { actor: 4, cat: "Config", sev: "Info", status: "Success", desc: "Automated incremental database backup completed.", meta: { size: "4.2GB", duration: "14s" } },
        { actor: 4, cat: "Vehicle", sev: "Warning", status: "Success", desc: "AI flagged category mismatch. Expected: Motorcycle, Detected: Light Vehicle.", meta: { plate: "AA 11228", confidence: "88%" }, vehicleCategory: "Motorcycle | Motorcycle" },
        { actor: 0, cat: "Config", sev: "Warning", status: "Success", desc: "Disabled CBE Birr payment gateway globally.", meta: { before: { cbeBirr: true }, after: { cbeBirr: false } } },
        { actor: 1, cat: "Config", sev: "Info", status: "Success", desc: "Updated physical address for Adama Branch.", meta: { branch: "Adama Terminal" } },
        { actor: 4, cat: "Node", sev: "Info", status: "Success", desc: "Node AD-01 successfully completed scheduled reboot.", meta: { uptime: "0m 12s" } },
        { actor: 4, cat: "Auth", sev: "Warning", status: "Success", desc: "Rate limiting triggered for API-01 due to high volume of 2FA requests.", meta: { threshold: "100/min", current: "142/min" } },
        { actor: 5, cat: "Auth", sev: "Warning", status: "Failed", desc: "Driver login failed. Incorrect password.", meta: { attempts: 2 } },
        { actor: 2, cat: "Vehicle", sev: "Critical", status: "Success", desc: "Logged 'Fled Without Payment' incident for unknown vehicle.", meta: { debtAmount: 150, action: "Added to Watchlist" }, vehicleCategory: "Machineries | Upto 5000KG weight" },
        { actor: 4, cat: "Vehicle", sev: "Info", status: "Success", desc: "Auto-cleared reservation for plate AA 99321 upon exit.", meta: { duration: "0h 45m" }, vehicleCategory: "Bicycle | Bicycle" },
        { actor: 0, cat: "Config", sev: "Critical", status: "Success", desc: "Re-initialized Owner Account credentials. Master access purged.", meta: { target: "owner@visionpark.et" } },
        { actor: 1, cat: "Financial", sev: "Info", status: "Success", desc: "Requested payout withdrawal to linked CBE account.", meta: { amount: 45000, status: "Pending" } },
        { actor: 6, cat: "Vehicle", sev: "Info", status: "Success", desc: "Driver cancelled active reservation. Spot released to pool.", meta: { sessionId: "RSV-992", refund: false }, vehicleCategory: "Dry Freight Vehicles | >71 Quintal" },
        { actor: 4, cat: "Node", sev: "Warning", status: "Success", desc: "High CPU utilization detected on Node AA-03.", meta: { cpu: "92%", temp: "78C" } },
        { actor: 3, cat: "Vehicle", sev: "Info", status: "Failed", desc: "Attempted to process Walk-Up deposit. Network timeout.", meta: { error: "ERR_CONNECTION_TIMEOUT" }, vehicleCategory: "Liquid Cargo Vehicles | Above 28 Liter" },
        { actor: 0, cat: "Auth", sev: "Info", status: "Success", desc: "System Admin logged into infrastructure dashboard.", meta: { sessionLength: "New" } },
        { actor: 4, cat: "Config", sev: "Info", status: "Success", desc: "Synchronized YOLOv8 weights to all active edge nodes.", meta: { version: "v4.1.2-b" } },
        { actor: 1, cat: "Auth", sev: "Info", status: "Success", desc: "Owner logged into business dashboard.", meta: { device: "Mac OS / Safari" } },
    ];

    for (let i = 0; i < scenarios.length; i++) {
        const s = scenarios[i];
        const logDate = new Date(now);
        if (i > 5 && i <= 15) logDate.setDate(logDate.getDate() - 1);
        if (i > 15) logDate.setDate(logDate.getDate() - Math.floor(Math.random() * 14) - 2);
        logDate.setHours(Math.max(0, 23 - i), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        logs.push({
            id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: logDate,
            actor: actors[s.actor],
            category: s.cat,
            severity: s.sev,
            status: s.status,
            description: s.desc,
            ip: s.actor === 4 ? "127.0.0.1" : `196.189.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 255)}`,
            metadata: s.meta,
            vehicleCategory: s.vehicleCategory || null,
        });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
};

const formatDateTime = (date) =>
    date.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AuditLog() {
    const { showToast } = useOutletContext();

    const [logs] = useState(generateMockLogs());

    // ── Filter state ──────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        dateRange: "Today",
        actor: "All",
        category: "All",
        severity: "All",
        search: "",
        vehicleCategory: "All",   // "All" | one of ALL_VEHICLE_OPTIONS
    });

    const [activeDropdown, setActiveDropdown] = useState(null); // id string for inline dropdowns
    const [showVehCatModal, setShowVehCatModal] = useState(false); // vehicle category modal

    // ── UI state ──────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedLog, setSelectedLog] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [exportingType, setExportingType] = useState(null);

    // ── Filter logic ──────────────────────────────────────────────────────
    const filteredLogs = useMemo(() => {
        const now = new Date();
        return logs.filter(log => {
            const searchMatch =
                log.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                log.id.toLowerCase().includes(filters.search.toLowerCase());
            const actorMatch = filters.actor === "All" || log.actor.role === filters.actor;
            const catMatch = filters.category === "All" || log.category === filters.category;
            const sevMatch = filters.severity === "All" || log.severity === filters.severity;

            // Vehicle category filter: only applies to Vehicle-category logs that carry a vehicleCategory tag
            const vehCatMatch =
                filters.vehicleCategory === "All" ||
                (log.vehicleCategory === filters.vehicleCategory);

            let dateMatch = true;
            const diffDays = Math.ceil(Math.abs(now - log.timestamp) / (1000 * 60 * 60 * 24));
            if (filters.dateRange === "Today") {
                dateMatch = log.timestamp.getDate() === now.getDate() && log.timestamp.getMonth() === now.getMonth();
            } else if (filters.dateRange === "Last 7 Days") {
                dateMatch = diffDays <= 7;
            } else if (filters.dateRange === "Last 30 Days") {
                dateMatch = diffDays <= 30;
            }

            return searchMatch && actorMatch && catMatch && sevMatch && dateMatch && vehCatMatch;
        });
    }, [logs, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useMemo(() => setCurrentPage(1), [filters]);

    const stats = {
        total: logs.length,
        critical: logs.filter(l => l.severity === "Critical").length,
        today: logs.filter(l => { const n = new Date(); return l.timestamp.getDate() === n.getDate() && l.timestamp.getMonth() === n.getMonth(); }).length,
        filtered: filteredLogs.length,
    };

    const isVehFiltered = filters.vehicleCategory !== "All";

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleExport = (type) => {
        setExportingType(type);
        setTimeout(() => {
            setExportingType(null);
            const ok = Math.random() > 0.15;
            ok
                ? showToast(`Successfully generated and downloaded ${type.toUpperCase()} file.`, "success")
                : showToast(`Failed to export ${type.toUpperCase()}. Network error or timeout.`, "error");
        }, 1500);
    };

    const toggleRowExpand = (e, id) => {
        e.stopPropagation();
        const next = new Set(expandedRows);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedRows(next);
    };

    // ── Helpers ───────────────────────────────────────────────────────────
    const getCategoryIcon = (cat) => {
        switch (cat) {
            case "Auth": return <ShieldAlert className="h-4 w-4" />;
            case "Config": return <Database className="h-4 w-4" />;
            case "Financial": return <CreditCard className="h-4 w-4" />;
            case "Vehicle": return <Car className="h-4 w-4" />;
            case "Node": return <Server className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };
    const getSeverityDot = (sev) =>
        sev === "Critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            : sev === "Warning" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                : "bg-zinc-400";

    const getRoleBadge = (role) => {
        if (role === "Admin") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
        if (role === "Owner") return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
        if (role === "Attendant") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
        if (role === "Driver") return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30";
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    };

    // ── Inline custom dropdown (for date/actor/category/severity) ─────────
    const CustomFilterDropdown = ({ id, value, options, onChange, prefix, className = "" }) => {
        const isOpen = activeDropdown === id;
        return (
            <div className={`relative ${className}`}>
                <button onClick={() => setActiveDropdown(isOpen ? null : id)}
                    className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 bg-zinc-50 dark:bg-black/40 border rounded-xl text-sm font-bold outline-none transition-colors
                        ${isOpen ? "border-indigo-500 ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-400" : "border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400"}`}>
                    <span className="truncate">
                        {prefix && <span className="font-normal text-zinc-500 dark:text-zinc-400 mr-1">{prefix}:</span>}
                        {value}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-indigo-500" : "text-zinc-400"}`} />
                </button>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute right-0 lg:left-0 top-full mt-2 w-full min-w-[160px] bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-1.5 flex flex-col max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map(option => (
                                    <button key={option} onClick={() => { onChange(option); setActiveDropdown(null); }}
                                        className={`px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors outline-none ${value === option ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // ── RENDER ────────────────────────────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ScrollText className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500" />
                        Audit Log
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Complete immutable record of all system actions.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                    <button onClick={() => handleExport("csv")} disabled={exportingType !== null}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all outline-none active:scale-95 disabled:opacity-50">
                        {exportingType === "csv" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        {exportingType === "csv" ? "Exporting..." : "Export CSV"}
                    </button>
                    <button onClick={() => handleExport("pdf")} disabled={exportingType !== null}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 disabled:opacity-50">
                        {exportingType === "pdf" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {exportingType === "pdf" ? "Generating..." : "Export PDF"}
                    </button>
                </div>
            </div>

            {/* 2. FILTER BAR ─────────────────────────────────────────────────
                The vehicle category filter is a separate trigger button that
                opens a grouped modal (same pattern as the location filters).
                It sits in its own row below the standard dropdowns so the grid
                doesn't get cramped on smaller screens.
            ── */}
            <div className="bg-white dark:bg-[#121214] p-4 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 ml-1">
                    <Filter className="h-4 w-4" /> Log Filters
                </div>

                {/* Row 1 — standard filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input type="text" placeholder="Search description..."
                            value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <CustomFilterDropdown id="date" value={filters.dateRange} prefix="Date" options={["Today", "Last 7 Days", "Last 30 Days", "All Time"]} onChange={val => setFilters({ ...filters, dateRange: val })} />
                    <CustomFilterDropdown id="actor" value={filters.actor} prefix="Actor" options={["All", "Admin", "Owner", "Attendant", "Driver", "AI System"]} onChange={val => setFilters({ ...filters, actor: val })} />
                    <CustomFilterDropdown id="category" value={filters.category} prefix="Type" options={["All", "Auth", "Config", "Financial", "Vehicle", "Node"]} onChange={val => setFilters({ ...filters, category: val })} />
                    <CustomFilterDropdown id="severity" value={filters.severity} prefix="Severity" options={["All", "Info", "Warning", "Critical"]} onChange={val => setFilters({ ...filters, severity: val })} className="sm:col-span-2 lg:col-span-4 xl:col-span-1" />
                </div>

                {/* Row 2 — vehicle category filter
                    Shows as a button that opens the grouped modal.
                    Greyed-out hint when no vehicle filter is active;
                    highlighted with an active badge + clear × when one is set.
                */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setShowVehCatModal(true)}
                        className={`flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-xl text-sm font-bold outline-none transition-all border
                            ${isVehFiltered
                                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-400"
                                : "bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400"
                            }`}
                    >
                        <Car className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">
                            {isVehFiltered
                                ? <><span className="font-normal text-indigo-500 mr-1">Vehicle Type:</span>{getGroupLabel(filters.vehicleCategory)}</>
                                : <span className="text-zinc-500">Vehicle Type: All</span>
                            }
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 ml-1`} />
                    </button>

                    {/* Active filter pill — shows the full subcategory and lets the user clear it */}
                    {isVehFiltered && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 animate-in fade-in">
                            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-[260px]">
                                {filters.vehicleCategory}
                            </span>
                            <button
                                onClick={() => setFilters(f => ({ ...f, vehicleCategory: "All" }))}
                                className="p-0.5 rounded-full text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors outline-none"
                                title="Clear vehicle category filter"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. STATS ROW */}
            <div className="flex flex-wrap items-center gap-3 md:gap-6 shrink-0 px-2">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total Events:</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-white">{stats.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Critical Events:</span>
                    <span className="text-sm font-black text-red-600 dark:text-red-500">{stats.critical.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Today's Events:</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-white">{stats.today.toLocaleString()}</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        Filtered Results: {stats.filtered.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* 4. AUDIT LOG TABLE */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                <div className="overflow-x-auto w-full custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-black/20">
                                <th className="px-5 py-4 font-black w-10 text-center">Sev</th>
                                <th className="px-5 py-4 font-black">Timestamp</th>
                                <th className="px-5 py-4 font-black">Actor</th>
                                <th className="px-5 py-4 font-black">Category</th>
                                <th className="px-5 py-4 font-black w-[30%]">Description</th>
                                <th className="px-5 py-4 font-black">Vehicle Type</th>
                                <th className="px-5 py-4 font-black">IP Address</th>
                                <th className="px-5 py-4 font-black text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {paginatedLogs.length > 0 ? paginatedLogs.map(log => {
                                const isExpanded = expandedRows.has(log.id);
                                return (
                                    <tr key={log.id} onClick={() => setSelectedLog(log)}
                                        className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">

                                        <td className="px-5 py-4">
                                            <div className="flex justify-center">
                                                <div className={`h-2 w-2 rounded-full ${getSeverityDot(log.severity)}`} title={log.severity} />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono font-medium text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                                            {formatDateTime(log.timestamp)}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="font-bold text-zinc-900 dark:text-white mb-1">{log.actor.name}</div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(log.actor.role)}`}>
                                                {log.actor.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider">
                                                <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">
                                                    {getCategoryIcon(log.category)}
                                                </div>
                                                {log.category}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`font-medium text-zinc-700 dark:text-zinc-300 ${isExpanded ? "" : "line-clamp-2"}`}>
                                                    {log.description}
                                                </span>
                                                {log.description.length > 60 && (
                                                    <button onClick={e => toggleRowExpand(e, log.id)}
                                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest outline-none">
                                                        {isExpanded ? "Show Less" : "Show More"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Vehicle type column — only populated for Vehicle entries */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {log.vehicleCategory ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                                        {getGroupLabel(log.vehicleCategory)}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 font-medium max-w-[140px] truncate">
                                                        {log.vehicleCategory.split(" | ")[1] || log.vehicleCategory}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300 dark:text-zinc-700 text-xs">—</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                                            {log.ip}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end">
                                                {log.status === "Success"
                                                    ? <CheckCircle className="h-5 w-5 text-emerald-500" title="Success" />
                                                    : <XCircle className="h-5 w-5 text-red-500" title="Failed" />
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8" className="px-5 py-16 text-center text-zinc-500">
                                        <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold text-zinc-400">No logs found matching your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex items-center justify-between shrink-0">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed outline-none transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed outline-none transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. LOG ENTRY DETAIL DRAWER */}
            {selectedLog && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] animate-in fade-in duration-200 pointer-events-auto" />
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-[#18181b] shadow-2xl border-l border-zinc-200 dark:border-white/10 z-[999] flex flex-col animate-in slide-in-from-right duration-300">

                        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                    <ScrollText className="h-5 w-5 text-indigo-500" /> Event Details
                                </h2>
                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{selectedLog.id}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                            {/* Status & Severity */}
                            <div className="flex gap-3">
                                <div className={`flex-1 p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 ${selectedLog.status === "Success" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"}`}>
                                    {selectedLog.status === "Success" ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                    <span className="text-xs font-black uppercase tracking-widest">{selectedLog.status}</span>
                                </div>
                                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 flex flex-col items-center justify-center gap-2">
                                    <div className={`h-3 w-3 rounded-full ${getSeverityDot(selectedLog.severity)}`} />
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{selectedLog.severity}</span>
                                </div>
                            </div>

                            {/* Vehicle Category badge (if present) */}
                            {selectedLog.vehicleCategory && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10">
                                    <Car className="h-5 w-5 text-indigo-500 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-0.5">Vehicle Category</p>
                                        <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{selectedLog.vehicleCategory}</p>
                                    </div>
                                </div>
                            )}

                            {/* Timestamp & IP */}
                            <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 mb-1"><Clock className="h-3 w-3" /> Timestamp</p>
                                    <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white">{formatDateTime(selectedLog.timestamp)}</p>
                                </div>
                                <div className="h-px bg-zinc-200 dark:bg-white/5 w-full" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 mb-1"><MapPin className="h-3 w-3" /> IP Address</p>
                                    <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white">{selectedLog.ip}</p>
                                </div>
                            </div>

                            {/* Actor */}
                            <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 mb-3"><User className="h-3 w-3" /> Actor</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                                        {selectedLog.actor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedLog.actor.name}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(selectedLog.actor.role)}`}>
                                            {selectedLog.actor.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-indigo-500" /> Event Details
                                </h3>
                                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                        {getCategoryIcon(selectedLog.category)} {selectedLog.category} Action
                                    </div>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">{selectedLog.description}</p>
                                </div>
                            </div>

                            {/* Metadata */}
                            {selectedLog.metadata && (
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Database className="h-4 w-4 text-indigo-500" /> Technical Payload
                                    </h3>
                                    {selectedLog.metadata.before || selectedLog.metadata.after ? (
                                        <div className="flex flex-col gap-2">
                                            {selectedLog.metadata.before && (
                                                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 overflow-x-auto">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-200 dark:border-white/10 pb-1">Previous State</p>
                                                    <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{JSON.stringify(selectedLog.metadata.before, null, 2)}</pre>
                                                </div>
                                            )}
                                            {selectedLog.metadata.after && (
                                                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 overflow-x-auto">
                                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 border-b border-indigo-200 dark:border-indigo-500/20 pb-1">New State</p>
                                                    <pre className="text-xs font-mono text-indigo-700 dark:text-indigo-300">{JSON.stringify(selectedLog.metadata.after, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-zinc-900 dark:bg-black border border-zinc-800 dark:border-white/10 overflow-x-auto">
                                            <pre className="text-xs font-mono text-emerald-400">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 shrink-0">
                            <button onClick={() => setSelectedLog(null)}
                                className="w-full py-3.5 rounded-xl font-bold text-sm bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors outline-none active:scale-95 flex items-center justify-center gap-2">
                                <X className="h-4 w-4" /> Close Details
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── VEHICLE CATEGORY MODAL ───────────────────────────────────────
                Grouped list identical in style to the location filter modals
                in PlatformAnalytics, SessionManager, and PaymentGateway.
            ── */}
            {showVehCatModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowVehCatModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50 dark:bg-[#121214]">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Car className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-zinc-900 dark:text-white">Select Vehicle Type</h2>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Filter Vehicle-related events</p>
                                </div>
                            </div>
                            <button onClick={() => setShowVehCatModal(false)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* "All" option */}
                        <div className="px-3 pt-3 shrink-0">
                            <button onClick={() => { setFilters(f => ({ ...f, vehicleCategory: "All" })); setShowVehCatModal(false); }}
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer
                                    ${filters.vehicleCategory === "All"
                                        ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm"
                                        : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                                    }`}>
                                All Vehicle Types {filters.vehicleCategory === "All" && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                        </div>

                        {/* Grouped options */}
                        <div className="p-3 overflow-y-auto overscroll-contain flex-1 custom-scrollbar space-y-3">
                            {VEHICLE_CATEGORY_GROUPS.map(group => (
                                <div key={group.group}>
                                    {/* Group label */}
                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-lg mb-1">
                                        {group.group}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {group.options.map(opt => (
                                            <button key={opt}
                                                onClick={() => { setFilters(f => ({ ...f, vehicleCategory: opt })); setShowVehCatModal(false); }}
                                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer
                                                    ${filters.vehicleCategory === opt
                                                        ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm"
                                                        : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                                                    }`}>
                                                {/* Split display: group | subtype */}
                                                <span className="min-w-0 truncate pr-2">
                                                    {opt.includes(" | ")
                                                        ? <><span className="text-zinc-400 font-medium mr-1">{opt.split(" | ")[0]}</span>{opt.split(" | ")[1]}</>
                                                        : opt
                                                    }
                                                </span>
                                                {filters.vehicleCategory === opt && <Check className="h-4 w-4 shrink-0 text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
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