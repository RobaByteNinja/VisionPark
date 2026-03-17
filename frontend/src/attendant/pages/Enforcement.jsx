import React, { useState } from "react";
import {
    ShieldAlert, Ban, Banknote, MapPin,
    Search, Lock, CheckCircle, X,
    AlertTriangle, History, LockOpen,
    Clock, Camera
} from "lucide-react";

// --- MOCK DEBT DATA (STRICTLY HISTORIC DEBT / BLACKLIST) ---
const INITIAL_DEBTS = [
    {
        id: "DBT-802",
        plate: "AA 11228",
        status: "Blocked at Entry",
        location: "Main Entry Gate",
        debtAmount: 150.00,
        reason: "Fled without paying on Mar 12",
        vehicleType: "Minibus (Up to 12)",
        isClamped: false,
        timeFlagged: "Just Now"
    },
    {
        id: "DBT-810",
        plate: "AA 99887",
        status: "Spotted in Lot",
        location: "Spot B02",
        debtAmount: 500.00,
        reason: "CCTV Identified (Hit & Run Property Damage)",
        vehicleType: "Light Vehicle",
        isClamped: false,
        timeFlagged: "2 mins ago"
    },
    {
        id: "DBT-805",
        plate: "OR 99401",
        status: "Spotted in Lot",
        location: "Spot B14",
        debtAmount: 45.00,
        reason: "Previous App Charge Failed (Insufficient Funds)",
        vehicleType: "Light Vehicle",
        isClamped: false,
        timeFlagged: "10 mins ago"
    }
];

export default function DebtEnforcement() {
    const [debts, setDebts] = useState(INITIAL_DEBTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("All");

    // Modal State
    const [activeModal, setActiveModal] = useState(null); // 'collect' | 'clamp'
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // --- DERIVED STATS ---
    const entryCount = debts.filter(d => d.status === "Blocked at Entry").length;
    const lotCount = debts.filter(d => d.status === "Spotted in Lot").length;
    const totalDebt = debts.reduce((sum, d) => sum + d.debtAmount, 0);

    // --- FILTERING ---
    const filteredDebts = debts.filter(d => {
        const matchesSearch = d.plate.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "All" || d.status === filter;
        return matchesSearch && matchesFilter;
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const openModal = (type, vehicle) => {
        setSelectedVehicle(vehicle);
        setActiveModal(type);
    };

    // --- ACTIONS ---
    const handleClampVehicle = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setDebts(debts.map(d => d.id === selectedVehicle.id ? { ...d, isClamped: true } : d));
            setIsProcessing(false);
            setActiveModal(null);
            showToast(`Spot ${selectedVehicle.location} clamped. Prevent exit until historic debt is paid.`);
        }, 800);
    };

    const handleCollectDebt = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setDebts(debts.filter(d => d.id !== selectedVehicle.id)); // Remove from radar once paid
            setIsProcessing(false);
            setActiveModal(null);
            showToast(`Success: ${selectedVehicle.debtAmount.toFixed(2)} ETB collected from ${selectedVehicle.plate}. Debt cleared!`);
        }, 1000);
    };

    // --- REUSABLE GLASS GREEN INPUT STYLES ---
    const glassGreenInputStyles = "w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:bg-emerald-50 dark:focus:bg-emerald-500/10 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all";

    return (
        <div className="h-full w-full flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 relative">

            {/* Toast Notification (Premium Green for System Success) */}
            {toastMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm px-6 py-3 rounded-2xl shadow-2xl z-[8000] animate-in slide-in-from-top-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> {toastMessage}
                </div>
            )}

            {/* HEADER & STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">

                <div className="bg-white dark:bg-[#121214] rounded-3xl p-5 md:p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col justify-center relative overflow-hidden">
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 relative z-10">
                        <Ban className="h-6 w-6 md:h-7 md:w-7 text-red-500" /> Debt Radar
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 relative z-10">Catch blacklisted and historic unpaid vehicles.</p>
                </div>

                <div className="bg-red-50 dark:bg-red-500/10 rounded-3xl p-5 md:p-6 shadow-sm border border-red-200 dark:border-red-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Active Threats</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-black text-red-700 dark:text-red-500">{entryCount + lotCount}</span>
                            <span className="text-xs md:text-sm font-bold text-red-600/70 dark:text-red-400/70">Vehicles</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-red-500 mt-1">{entryCount} at Entry • {lotCount} in Lot</p>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-200/50 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 animate-pulse shrink-0">
                        <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-[#18181b] rounded-3xl p-5 md:p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Recoverable Debt</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">{totalDebt.toFixed(0)}</span>
                            <span className="text-xs md:text-sm font-bold text-zinc-500">ETB</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 mt-1">From vehicles currently on-site</p>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                        <Banknote className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                </div>

            </div>

            {/* MAIN LIST AREA */}
            <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                    {/* ✅ Fully Responsive Flex Container with Gap and Wrap */}
                    <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 lg:gap-8 w-full">

                        <div className="relative w-full lg:max-w-sm shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search plate..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-sm font-bold ${glassGreenInputStyles}`}
                            />
                        </div>

                        {/* ✅ Filters gracefully wrap to next line if laptop screen is too tight */}
                        <div className="flex flex-row flex-wrap items-center gap-2 bg-white dark:bg-black/40 p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm w-full lg:w-auto">
                            {["All", "Blocked at Entry", "Spotted in Lot"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 lg:flex-none px-4 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all outline-none whitespace-nowrap text-center ${filter === f
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {/* ✅ Responsive Grid prevents cards from squishing on laptops */}
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
                        {filteredDebts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                                <CheckCircle className="h-16 w-16 mb-4 text-emerald-500 opacity-50" />
                                <p className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Lot is Clean!</p>
                                <p className="text-sm">No vehicles with outstanding debt detected.</p>
                            </div>
                        ) : (
                            filteredDebts.map((vehicle) => {
                                const isEntry = vehicle.status === "Blocked at Entry";
                                const isClamped = vehicle.isClamped;
                                const isCCTV = vehicle.reason.includes("CCTV");

                                const cardBorder = isClamped ? 'border-amber-200 dark:border-amber-500/30' : 'border-red-200 dark:border-red-500/30';
                                const cardBg = isClamped ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'bg-white dark:bg-[#18181b]';

                                const pillBg = isEntry ? 'bg-red-100 dark:bg-red-500/20' : 'bg-red-100 dark:bg-red-500/20';
                                const pillText = isEntry ? 'text-red-700 dark:text-red-400' : 'text-red-700 dark:text-red-400';
                                const dotColor = isEntry ? 'bg-red-500' : 'bg-red-500';

                                return (
                                    <div key={vehicle.id} className={`flex flex-col rounded-2xl border-2 transition-all overflow-hidden shadow-sm hover:shadow-md ${cardBg} ${cardBorder}`}>

                                        {/* Card Header */}
                                        <div className="p-4 md:p-5 pb-3 flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-black text-lg md:text-xl text-zinc-900 dark:text-white tracking-tight truncate">{vehicle.plate}</span>
                                                    {isClamped && <Lock className="h-4 w-4 text-amber-500 shrink-0" />}
                                                    {isCCTV && <Camera className="h-4 w-4 text-blue-500 shrink-0" title="Identified via CCTV" />}
                                                </div>
                                                <p className="text-[10px] md:text-xs font-bold text-zinc-500 truncate">{vehicle.vehicleType}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest ${pillBg} ${pillText}`}>
                                                    <div className={`h-2 w-2 rounded-full ${dotColor} ${isEntry ? 'animate-pulse' : ''} shrink-0`}></div>
                                                    {vehicle.status}
                                                </div>
                                                <div className="flex items-center gap-1 font-bold text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-widest">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {vehicle.location}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body (Time & Debt Info) */}
                                        <div className="px-4 md:px-5 py-4 grid grid-cols-2 gap-4 items-start">
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1 mb-0.5">
                                                    <Clock className="h-3 w-3 shrink-0" /> Flagged
                                                </p>
                                                <p className="text-base md:text-lg font-black text-red-500 tracking-tight truncate">{vehicle.timeFlagged}</p>

                                                <div className="mt-3 text-[9px] md:text-[10px] text-zinc-500 font-medium">
                                                    <span className="font-bold uppercase block text-zinc-400 mb-0.5">Reason:</span>
                                                    <span className={`leading-snug inline-block ${isCCTV ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                                                        {vehicle.reason}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Historic Due</p>
                                                <p className="text-lg md:text-xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
                                                    {vehicle.debtAmount.toFixed(2)} ETB
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className={`p-4 md:p-5 mt-auto border-t flex flex-col sm:flex-row gap-2 md:gap-3 ${isClamped ? 'bg-amber-100/50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
                                            'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10'
                                            }`}>

                                            {isEntry ? (
                                                <>
                                                    <button
                                                        onClick={() => openModal('clamp', vehicle)}
                                                        className="w-full sm:flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:border dark:border-orange-500/30 dark:text-orange-400 font-bold py-3 md:py-3.5 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer"
                                                    >
                                                        <Lock className="h-4 w-4" /> Clamp
                                                    </button>
                                                    <button
                                                        onClick={() => openModal('collect', vehicle)}
                                                        className="w-full sm:flex-[2] bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 md:py-3.5 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer"
                                                    >
                                                        <Banknote className="h-4 w-4" /> Collect & Let In
                                                    </button>
                                                </>
                                            ) : isClamped ? (
                                                <button
                                                    onClick={() => openModal('collect', vehicle)}
                                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 md:py-3.5 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer"
                                                >
                                                    <LockOpen className="h-4 w-4" /> Collect Fine & Unclamp
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => openModal('clamp', vehicle)}
                                                        className="w-full sm:flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:border dark:border-orange-500/30 dark:text-orange-400 font-bold py-3 md:py-3.5 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer"
                                                    >
                                                        <Lock className="h-4 w-4" /> Clamp
                                                    </button>
                                                    <button
                                                        onClick={() => openModal('collect', vehicle)}
                                                        className="w-full sm:flex-[1.5] bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 md:py-3.5 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer"
                                                    >
                                                        <Banknote className="h-4 w-4" /> Collect Debt
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* --- ACTION MODALS --- */}

            {/* 1. Clamp Vehicle Modal */}
            {activeModal === 'clamp' && selectedVehicle && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
                    <div className="w-full max-w-md bg-white dark:bg-[#121214] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>

                        <div className="bg-yellow-400 dark:bg-orange-500 p-6 flex flex-col items-center justify-center text-yellow-950 dark:text-orange-950 relative">
                            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5 text-current" />
                            </button>
                            <div className="bg-white/20 p-3 rounded-2xl mb-3 shadow-sm backdrop-blur-sm">
                                <Lock className="h-10 w-10 text-current" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Clamp Authorization</h2>
                            <p className="font-bold text-[10px] md:text-xs opacity-80 uppercase tracking-widest mt-1">{selectedVehicle.location}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 text-center">
                                You are about to lock down vehicle <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedVehicle.plate}</span>.
                                Do not remove the clamp until the historic debt of {selectedVehicle.debtAmount.toFixed(2)} ETB is paid.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                                {/* Premium Black for Cancel */}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="w-full sm:flex-1 py-3.5 md:py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-bold transition-colors outline-none cursor-pointer shadow-sm active:scale-95 text-sm md:text-base"
                                >
                                    Cancel
                                </button>
                                {/* Premium Green for Confirm Action */}
                                <button
                                    onClick={handleClampVehicle}
                                    disabled={isProcessing}
                                    className="w-full sm:flex-[2] bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-3.5 md:py-4 rounded-xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-sm md:text-base"
                                >
                                    {isProcessing ? <span className="animate-pulse">Processing...</span> : "Confirm Clamp"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Process Debt Collection Modal */}
            {activeModal === 'collect' && selectedVehicle && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
                    <div className="w-full max-w-md bg-white dark:bg-[#121214] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>

                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-emerald-950 shadow-inner">
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg md:text-xl text-zinc-900 dark:text-white leading-none">Collect Debt</h3>
                                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mt-1">Clear Account</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-6 space-y-6">

                            <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Historic Balance Due</span>
                                    <span>{selectedVehicle.debtAmount.toFixed(2)} ETB</span>
                                </div>
                                <div className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
                                    Reason: {selectedVehicle.reason}
                                </div>
                                <div className="h-px w-full bg-zinc-200 dark:bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Cash to Collect</span>
                                    <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedVehicle.debtAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {/* Premium Black for Cancel */}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="w-full sm:flex-1 py-3.5 md:py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-bold transition-colors outline-none cursor-pointer shadow-sm active:scale-95 text-sm md:text-base"
                                >
                                    Cancel
                                </button>

                                {/* Premium Green for Confirm Action */}
                                <button
                                    onClick={handleCollectDebt}
                                    disabled={isProcessing}
                                    className="w-full sm:flex-[2] bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-3.5 md:py-4 rounded-xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-sm md:text-base"
                                >
                                    {isProcessing ? (
                                        <span className="animate-pulse">Processing...</span>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                                            <span className="truncate">
                                                {selectedVehicle.status === 'Blocked at Entry' ? 'Confirm & Let In' :
                                                    selectedVehicle.isClamped ? 'Confirm & Unclamp' : 'Confirm Payment'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}