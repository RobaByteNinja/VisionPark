import React, { useState, useEffect } from "react";
import {
    Clock, AlertOctagon, Lock, Banknote,
    MapPin, ShieldAlert, CheckCircle, Search,
    LockOpen, Smartphone, X, Wifi, ArrowRight
} from "lucide-react";

// --- MOCK DATA WITH TIMESTAMPS ---
const INITIAL_OVERSTAYS = [
    {
        id: "OV-104",
        plate: "AA 45892",
        spot: "B04",
        type: "Walk-Up (Cash)",
        category: "Light Vehicle",
        enteredAt: "08:30 AM",
        expiredAt: "10:30 AM",
        exitedAt: null, // Still parked
        overstayDuration: "1h 45m",
        baseDebt: 35.00,
        penaltyFee: 50.00,
        systemState: "OVERSTAY",
        isClamped: false
    },
    {
        id: "OV-105",
        plate: "OR 12904",
        spot: "EXIT GATE A",
        type: "Registered (Chapa)",
        category: "Minibus (Up to 12)",
        enteredAt: "09:15 AM",
        expiredAt: "11:15 AM",
        exitedAt: "11:25 AM", // Reached exit gate
        overstayDuration: "At Exit",
        baseDebt: 45.00,
        penaltyFee: 0.00,
        systemState: "PENDING", // Chapa failed at exit
        isClamped: false
    },
    {
        id: "OV-106",
        plate: "UN 99321",
        spot: "C01",
        type: "Walk-Up (Cash)",
        category: "Light Vehicle",
        enteredAt: "06:00 AM",
        expiredAt: "08:00 AM",
        exitedAt: null,
        overstayDuration: "4h 15m",
        baseDebt: 85.00,
        penaltyFee: 100.00,
        systemState: "OVERSTAY",
        isClamped: true
    },
    {
        id: "OV-107",
        plate: "AA 11223",
        spot: "D05",
        type: "Registered (Chapa)",
        category: "Light Vehicle",
        enteredAt: "10:15 AM",
        expiredAt: "12:15 PM",
        exitedAt: null,
        overstayDuration: "45 mins left", // Still valid
        baseDebt: 0.00,
        penaltyFee: 0.00,
        systemState: "ACTIVE",
        isClamped: false
    }
];

export default function Overstays() {
    const [overstays, setOverstays] = useState(INITIAL_OVERSTAYS);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("All");

    // Modal & Processing State
    const [activeModal, setActiveModal] = useState(null); // 'payment' | 'clamp'
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // --- DERIVED STATS ---
    const overstayCount = overstays.filter(o => o.systemState === "OVERSTAY").length;
    const pendingCount = overstays.filter(o => o.systemState === "PENDING").length;
    const clampedCount = overstays.filter(o => o.isClamped).length;
    const totalUnpaid = overstays
        .filter(o => o.systemState === "OVERSTAY" || o.systemState === "PENDING")
        .reduce((sum, o) => sum + o.baseDebt + o.penaltyFee, 0);

    // --- FILTERING ---
    const filteredOverstays = overstays.filter(o => {
        const matchesSearch = o.plate.toLowerCase().includes(searchQuery.toLowerCase()) || o.spot.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (filter === "Overstay") matchesFilter = o.systemState === "OVERSTAY";
        if (filter === "Pending") matchesFilter = o.systemState === "PENDING";
        if (filter === "Clamped") matchesFilter = o.isClamped;
        if (filter === "Active") matchesFilter = o.systemState === "ACTIVE";
        if (filter === "Paid") matchesFilter = o.systemState === "PAID";

        return matchesSearch && matchesFilter;
    });

    // --- ACTION HELPERS ---
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const openModal = (type, vehicle) => {
        setSelectedVehicle(vehicle);
        setActiveModal(type);
        setIsSyncing(true);
    };

    // 🔴 CLAMP VEHICLE
    const handleClampVehicle = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setOverstays(overstays.map(o => o.id === selectedVehicle.id ? { ...o, isClamped: true } : o));
            setIsProcessing(false);
            setActiveModal(null);
            showToast(`Spot ${selectedVehicle.spot} clamped. Vehicle locked.`);
        }, 800);
    };

    // 🟢 SIMULATE AUTOMATIC APP PAYMENT (THE IDEAL FLOW)
    const handleDriverAppPaymentSync = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const exitTime = selectedVehicle.exitedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setOverstays(overstays.map(o =>
                o.id === selectedVehicle.id
                    ? { ...o, systemState: "PAID", isClamped: false, baseDebt: 0, penaltyFee: 0, exitedAt: exitTime }
                    : o
            ));
            setIsProcessing(false);
            setActiveModal(null);
            showToast(`SYNC SUCCESS: Driver paid via App! Gate Unlocked.`);
        }, 1500);
    };

    // 🟠 MANUAL CASH FALLBACK (PHONE DEAD)
    const handleManualCashPayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const exitTime = selectedVehicle.exitedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setOverstays(overstays.map(o =>
                o.id === selectedVehicle.id
                    ? { ...o, systemState: "PAID", isClamped: false, baseDebt: 0, penaltyFee: 0, exitedAt: exitTime }
                    : o
            ));
            setIsProcessing(false);
            setActiveModal(null);
            showToast(`MANUAL OVERRIDE: Cash collected. Gate Unlocked.`);
        }, 1000);
    };

    // --- BADGE RENDERER ---
    const renderSystemBadge = (state) => {
        switch (state) {
            case "PAID":
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> 🟢 PAID
                    </div>
                );
            case "ACTIVE":
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/20 font-bold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> 🟡 ACTIVE
                    </div>
                );
            case "PENDING":
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-500/20 font-bold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                        <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div> 🟠 PENDING AT EXIT
                    </div>
                );
            case "OVERSTAY":
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 dark:bg-red-500/20 font-bold text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/30">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> 🔴 LOT OVERSTAY
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-6 animate-in fade-in duration-500 relative">

            {/* Toast Notification */}
            {toastMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm px-6 py-3 rounded-2xl shadow-2xl z-[8000] animate-in slide-in-from-top-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> {toastMessage}
                </div>
            )}

            {/* HEADER & STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">

                <div className="bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col justify-center">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <ShieldAlert className="h-7 w-7 text-red-500" /> Enforcement
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track overstays, clamps, and failed payments.</p>
                </div>

                <div className="bg-red-50 dark:bg-red-500/10 rounded-3xl p-6 shadow-sm border border-red-200 dark:border-red-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Overstays & Pending</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-red-700 dark:text-red-500">{overstayCount + pendingCount}</span>
                            <span className="text-sm font-bold text-red-600/70 dark:text-red-400/70">Vehicles</span>
                        </div>
                        <p className="text-[10px] font-bold text-red-500 mt-1">{clampedCount} vehicles clamped</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-200/50 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertOctagon className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-3xl p-6 shadow-sm border border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Uncollected Debt</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-amber-700 dark:text-amber-500">{totalUnpaid.toFixed(0)}</span>
                            <span className="text-sm font-bold text-amber-600/70 dark:text-amber-400/70">ETB</span>
                        </div>
                        <p className="text-[10px] font-bold text-amber-500 mt-1">Pending payments + Fines</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-200/50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Banknote className="h-6 w-6" />
                    </div>
                </div>

            </div>

            {/* MAIN LIST AREA */}
            <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search plate or spot..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-colors"
                        />
                    </div>

                    <div className="flex bg-white dark:bg-black/40 p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm w-full sm:w-auto overflow-x-auto custom-scrollbar">
                        {["All", "Pending", "Overstay", "Clamped", "Active", "Paid"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all outline-none whitespace-nowrap ${filter === f
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredOverstays.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                                <CheckCircle className="h-16 w-16 mb-4 text-emerald-500 opacity-50" />
                                <p className="text-lg font-bold text-zinc-900 dark:text-white">Filter Clear!</p>
                                <p className="text-sm">No vehicles match this status.</p>
                            </div>
                        ) : (
                            filteredOverstays.map((vehicle) => {
                                const isPaid = vehicle.systemState === "PAID";
                                const isActive = vehicle.systemState === "ACTIVE";
                                const isPending = vehicle.systemState === "PENDING";
                                const isClamped = vehicle.isClamped;

                                return (
                                    <div key={vehicle.id} className={`flex flex-col rounded-2xl border-2 transition-all overflow-hidden ${isPaid ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 opacity-70' :
                                            isClamped ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/50' :
                                                isActive ? 'bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/10' :
                                                    isPending ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10' :
                                                        'bg-white dark:bg-[#18181b] border-red-500/50 shadow-lg shadow-red-500/10'
                                        }`}>

                                        {/* Card Header */}
                                        <div className={`p-4 border-b flex items-start justify-between ${isPaid ? 'border-emerald-200 dark:border-emerald-500/20' :
                                                isClamped ? 'border-amber-200 dark:border-amber-500/20' :
                                                    isPending ? 'border-orange-200 dark:border-orange-500/20' :
                                                        isActive ? 'border-zinc-200 dark:border-white/10' :
                                                            'border-red-100 dark:border-red-500/20'
                                            }`}>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-mono font-black text-xl px-2 py-0.5 rounded ${isPaid ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'}`}>{vehicle.plate}</span>
                                                    {isClamped && <Lock className="h-5 w-5 text-amber-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-zinc-500">{vehicle.type}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {renderSystemBadge(vehicle.systemState)}
                                                <div className="flex items-center gap-1.5 font-bold text-zinc-500 text-xs">
                                                    <MapPin className="h-3 w-3" /> {vehicle.spot}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Matrix (Duration & Details) */}
                                        <div className="p-4 grid grid-cols-2 gap-4">

                                            {/* Left: Timestamps & Status */}
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1 ${isPaid ? 'text-emerald-600' : isActive ? 'text-blue-500' : isPending ? 'text-orange-500' : 'text-red-500'
                                                    }`}>
                                                    <Clock className="h-3 w-3" />
                                                    {isPaid ? 'Resolved' : isActive ? 'Time Left' : isPending ? 'Gate Status' : 'Overstayed By'}
                                                </p>
                                                <p className={`text-xl font-black ${isPaid ? 'text-emerald-600 dark:text-emerald-500' :
                                                        isActive ? 'text-blue-600 dark:text-blue-400' :
                                                            isPending ? 'text-orange-600 dark:text-orange-400' :
                                                                'text-red-600 dark:text-red-400 animate-pulse'
                                                    }`}>
                                                    {vehicle.overstayDuration}
                                                </p>

                                                {/* ✅ NEW: Explicit Timestamp Details */}
                                                <div className="mt-2.5 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                        <span className="font-bold uppercase w-6">In:</span> {vehicle.enteredAt}
                                                    </div>
                                                    {vehicle.expiredAt && vehicle.expiredAt !== "N/A" && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                            <span className="font-bold uppercase w-6 text-amber-500/80">Exp:</span> {vehicle.expiredAt}
                                                        </div>
                                                    )}
                                                    {vehicle.exitedAt && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                            <span className="font-bold uppercase w-6 text-blue-500/80">Out:</span> {vehicle.exitedAt}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Debt Info */}
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Due</p>
                                                <p className={`text-xl font-black ${isPaid ? 'text-emerald-600 line-through opacity-50' : 'text-zinc-900 dark:text-white'}`}>
                                                    {(vehicle.baseDebt + vehicle.penaltyFee).toFixed(2)} ETB
                                                </p>
                                                {vehicle.penaltyFee > 0 && !isPaid && (
                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-1">Includes {vehicle.penaltyFee} penalty</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons (Hidden if Paid or Active) */}
                                        {!isPaid && !isActive && (
                                            <div className={`p-4 mt-auto border-t flex gap-2 ${isClamped ? 'border-amber-200 dark:border-amber-500/20 bg-amber-100/50 dark:bg-amber-500/5' :
                                                    isPending ? 'border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-black/20' :
                                                        'border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-black/20'
                                                }`}>

                                                {isClamped ? (
                                                    <button
                                                        onClick={() => openModal('payment', vehicle)}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <LockOpen className="h-4 w-4" /> Collect Fine & Unclamp
                                                    </button>
                                                ) : isPending ? (
                                                    <button
                                                        onClick={() => openModal('payment', vehicle)}
                                                        className="w-full bg-orange-500 hover:bg-orange-400 text-orange-950 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm animate-pulse"
                                                    >
                                                        <ShieldAlert className="h-4 w-4" /> Resolve Exit Gate Payment
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => openModal('clamp', vehicle)}
                                                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <Lock className="h-4 w-4" /> Clamp
                                                        </button>
                                                        <button
                                                            onClick={() => openModal('payment', vehicle)}
                                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <Banknote className="h-4 w-4" /> Collect Debt
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
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

                        <div className="bg-amber-500 p-6 flex flex-col items-center justify-center text-amber-950 relative">
                            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors outline-none">
                                <X className="h-5 w-5 text-amber-950" />
                            </button>
                            <div className="bg-white p-3 rounded-2xl mb-3 shadow-sm">
                                <Lock className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Clamp Authorization</h2>
                            <p className="font-bold text-xs opacity-80 uppercase tracking-widest mt-1">Spot {selectedVehicle.spot}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 text-center">
                                You are about to register a physical wheel clamp for vehicle <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedVehicle.plate}</span>.
                                Do not clear this status until the fine is paid.
                            </p>

                            <button
                                onClick={handleClampVehicle}
                                disabled={isProcessing}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <span className="animate-pulse">Registering Clamp...</span> : "Confirm Clamped Status"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Process Payment / Sync Modal */}
            {activeModal === 'payment' && selectedVehicle && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
                    <div className="w-full max-w-md bg-white dark:bg-[#121214] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-inner">
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-zinc-900 dark:text-white leading-none">Payment Resolution</h3>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mt-1">Clear Violation</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors outline-none"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Financial Breakdown */}
                            <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Base Exit Fee</span>
                                    <span>{selectedVehicle.baseDebt.toFixed(2)} ETB</span>
                                </div>
                                {selectedVehicle.penaltyFee > 0 && (
                                    <div className="flex justify-between items-center text-sm font-medium text-amber-600 dark:text-amber-500">
                                        <span>Rule Violation Penalty</span>
                                        <span>+{selectedVehicle.penaltyFee.toFixed(2)} ETB</span>
                                    </div>
                                )}

                                {/* Embedded Time Details */}
                                <div className="mt-2 text-[10px] text-zinc-500 flex justify-between bg-white dark:bg-black/20 p-2 rounded-lg border border-zinc-200 dark:border-white/5">
                                    <span>Entered: {selectedVehicle.enteredAt}</span>
                                    {selectedVehicle.exitedAt ? <span>Exited: {selectedVehicle.exitedAt}</span> : <span>Still Parked</span>}
                                </div>

                                <div className="h-px w-full bg-zinc-200 dark:bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Total Debt</span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{(selectedVehicle.baseDebt + selectedVehicle.penaltyFee).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* IDEAL FLOW: The Sync Radar */}
                            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-center space-y-3">
                                <Wifi className="h-6 w-6 text-blue-500 animate-pulse" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Listening for Driver App...</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1">System will auto-clear when driver pays via Chapa.</p>
                                </div>

                                {/* Simulator Button (For Presentation/Testing) */}
                                <button
                                    onClick={handleDriverAppPaymentSync}
                                    disabled={isProcessing}
                                    className="mt-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors active:scale-95 outline-none flex items-center gap-2"
                                >
                                    <Smartphone className="h-3 w-3" /> Simulate Driver Paying on App
                                </button>
                            </div>

                            {/* EMERGENCY FALLBACK: Manual Cash Collection */}
                            <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-3">
                                <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">Emergency Fallback Only</p>
                                <p className="text-center text-[10px] font-medium text-zinc-500 mb-3">
                                    Only collect physical cash if the driver's phone is dead, they cannot use the app, or the bank network is down.
                                </p>
                                <button
                                    onClick={handleManualCashPayment}
                                    disabled={isProcessing}
                                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessing ? (
                                        <span className="animate-pulse">Processing Override...</span>
                                    ) : (
                                        <>
                                            <Banknote className="h-4 w-4" /> Override: Collect {(selectedVehicle.baseDebt + selectedVehicle.penaltyFee).toFixed(2)} ETB in Cash
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