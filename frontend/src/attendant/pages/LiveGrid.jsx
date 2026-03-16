import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CarFront, AlertTriangle, Clock, X, ShieldAlert,
    User, Smartphone, ArrowRight, Video, ScanFace,
    CreditCard, MapPin, CheckCircle, Edit, Camera, Lock,
    Megaphone, Search
} from "lucide-react";

// --- FAKE BACKEND DATABASE FOR PLATE LOOKUPS ---
const MOCK_BACKEND_DB = {
    "AA 12345": { name: "Kebede T.", phone: "+251 911 000 111", category: "Light Vehicle", licenseType: "Private" },
    "OR 99887": { name: "Chaltu A.", phone: "+251 922 111 222", category: "Public Transport | <12 Seats", licenseType: "Commercial" }
};

// --- MOCK GRID DATA WITH SPECIFIC SCENARIOS ---
const generateMockGrid = () => {
    const spots = [];
    const rows = ['A', 'B', 'C', 'D'];
    const categories = ["Light Vehicle", "Public Transport | <12 Seats", "Motorcycle"];

    rows.forEach(row => {
        for (let i = 1; i <= 10; i++) {
            const id = `${row}${i.toString().padStart(2, '0')}`;
            let status = "Free";
            let expectedDriver = null;
            let squatterDriver = null;
            let isConflict = false;
            let isUnregistered = false;
            let actualPlate = null;
            let waitingToMove = false;

            // FORCE SPECIFIC SCENARIOS FOR TESTING
            if (id === 'A01') {
                // SCENARIO: Conflict (REGISTERED Squatter in Reserved Spot)
                status = "Conflict";
                isConflict = true;
                expectedDriver = { name: "Expected: Dawit M.", eta: "8 mins" };
                squatterDriver = { name: "Abebe Kebede", plate: "AA 45678", phone: "+251 911 234 567", category: categories[0] };
                actualPlate = "AA 45678";
            }
            else if (id === 'A02') {
                // SCENARIO: Conflict (UNREGISTERED Squatter in Reserved Spot)
                status = "Conflict";
                isConflict = true;
                expectedDriver = { name: "Expected: Sara T.", eta: "15 mins" };
                squatterDriver = null; // Unregistered
                actualPlate = "UNKNOWN";
            }
            else if (id === 'A03') {
                // SCENARIO: AI Unrecognized (Muddy Plate)
                status = "Occupied";
                isUnregistered = true;
                actualPlate = null; // Camera failed
            }
            // RANDOM FILL FOR THE REST
            else {
                const rand = Math.random();
                if (rand > 0.85) {
                    status = "Occupied";
                    expectedDriver = { name: "Yonas B.", plate: `AA ${Math.floor(10000 + Math.random() * 90000)}`, phone: "+251 911 234 567", category: categories[0] };
                } else if (rand > 0.70) {
                    status = "Reserved";
                    expectedDriver = { name: "Helen M.", plate: `OR ${Math.floor(10000 + Math.random() * 90000)}`, eta: "12 mins" };
                }
            }

            spots.push({ id, status, isConflict, isUnregistered, expectedDriver, squatterDriver, actualPlate, waitingToMove, category: categories[Math.floor(Math.random() * categories.length)] });
        }
    });
    return spots;
};

const INITIAL_GRID = generateMockGrid();

export default function LiveGrid() {
    const navigate = useNavigate();
    const [spots, setSpots] = useState(INITIAL_GRID);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [filter, setFilter] = useState("All");
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    const [manualPlate, setManualPlate] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const freeSpotsList = spots.filter(s => s.status === "Free");
    const suggestedAlternative = freeSpotsList.length > 0 ? freeSpotsList[0].id : null;

    // --- FUNCTIONALITY LOGIC --- //

    // 1. Backend Plate Lookup (For AI Exceptions)
    const handlePlateOverride = () => {
        if (!manualPlate) return;
        setIsLookingUp(true);

        // Simulate network delay
        setTimeout(() => {
            const backendData = MOCK_BACKEND_DB[manualPlate];

            if (backendData) {
                // Driver was registered all along! Just update the spot.
                const updatedDriver = { ...backendData, plate: manualPlate };
                setSpots(spots.map(s => s.id === selectedSpot.id ? { ...s, isUnregistered: false, expectedDriver: updatedDriver, actualPlate: manualPlate } : s));
                setSelectedSpot({ ...selectedSpot, isUnregistered: false, expectedDriver: updatedDriver, actualPlate: manualPlate });
                showToast("Success! Driver found in database and registered to spot.");
            } else {
                // Plate is completely new to the system. Keep unregistered, but update the plate so we can start POS.
                setSpots(spots.map(s => s.id === selectedSpot.id ? { ...s, actualPlate: manualPlate } : s));
                setSelectedSpot({ ...selectedSpot, actualPlate: manualPlate });
                showToast("Plate recorded. Vehicle is not in system. Start Walk-Up POS.");
            }
            setIsLookingUp(false);
            setManualPlate("");
        }, 1000);
    };

    // 2. Conflict: Instruct Registered Driver to Move
    const handleInstructToMove = () => {
        // Put the spot into a silent "Waiting to move" state
        setSpots(spots.map(s => s.id === selectedSpot.id ? { ...s, waitingToMove: true } : s));
        setSelectedSpot({ ...selectedSpot, waitingToMove: true });
        showToast("Driver instructed to move. System will monitor camera for departure.");
    };

    // 3. Conflict: Redirect Unregistered Squatter
    const handleRedirectSquatter = () => {
        if (!suggestedAlternative) {
            showToast("No free spots! Tell them to leave.");
            return;
        }
        showToast(`Redirecting to Spot ${suggestedAlternative}... Opening Walk-Up POS.`);
        setTimeout(() => navigate("/attendant/pos"), 1500);
    };

    const handleStartWalkUp = () => {
        navigate("/attendant/pos");
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const stats = {
        total: spots.length,
        free: freeSpotsList.length,
        reserved: spots.filter(s => s.status === "Reserved").length,
        occupied: spots.filter(s => s.status === "Occupied").length,
        conflicts: spots.filter(s => s.isConflict).length,
    };

    const filteredSpots = spots.filter(s => filter === "All" || s.status === filter || (filter === "Conflict" && s.isConflict));

    // ✅ STRICT PREMIUM COLORS
    const getSpotStyles = (spot) => {
        if (spot.isConflict) return "bg-purple-600 text-white border-purple-700 shadow-[0_0_20px_rgba(147,51,234,0.8)] animate-pulse z-10";
        if (spot.status === "Free") return "bg-emerald-500 text-white border-emerald-600 shadow-md hover:bg-emerald-400"; // PREMIUM GREEN
        if (spot.status === "Reserved") return "bg-yellow-400 text-zinc-900 border-yellow-500 shadow-md hover:bg-yellow-300"; // PREMIUM YELLOW
        return "bg-red-600 text-white border-red-700 shadow-md hover:bg-red-500"; // PREMIUM RED
    };

    return (
        <div className="h-full w-full flex gap-6 animate-in fade-in duration-500 relative overflow-hidden">

            {/* 1. MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all duration-300 min-w-0">
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-zinc-50 dark:bg-[#18181b]">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-emerald-500" /> Bole Premium Lot
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live AI capacity and visual spot monitoring.</p>
                    </div>

                    <div className="flex bg-white dark:bg-black/40 p-1.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-x-auto custom-scrollbar">
                        {["All", "Free", "Reserved", "Occupied", "Conflict"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all outline-none whitespace-nowrap ${filter === f
                                        ? f === 'Conflict' ? 'bg-purple-600 text-white shadow-md'
                                            : f === 'Free' ? 'bg-emerald-500 text-white shadow-md'
                                                : f === 'Reserved' ? 'bg-yellow-400 text-zinc-900 shadow-md'
                                                    : f === 'Occupied' ? 'bg-red-600 text-white shadow-md'
                                                        : 'bg-zinc-800 text-white shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {f} {f !== "All" && `(${f === 'Conflict' ? stats.conflicts : stats[f.toLowerCase()]})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto overscroll-contain custom-scrollbar bg-zinc-50/50 dark:bg-[#09090b]">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4 auto-rows-max">
                        {filteredSpots.map(spot => (
                            <button
                                key={spot.id}
                                onClick={() => { setSelectedSpot(spot); setManualPlate(""); }}
                                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all outline-none active:scale-95 cursor-pointer relative
                  ${getSpotStyles(spot)}
                  ${selectedSpot?.id === spot.id ? 'ring-4 ring-blue-500/50 scale-105 shadow-xl z-20' : 'hover:scale-105 hover:shadow-lg'}
                `}
                            >
                                {spot.waitingToMove && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-white animate-ping"></div>}
                                <span className="font-mono font-black text-sm md:text-lg tracking-tighter">{spot.id}</span>
                                {spot.isConflict && <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />}
                                {!spot.isConflict && spot.status === "Reserved" && <Clock className="h-4 w-4 md:h-5 md:w-5 opacity-80" />}
                                {!spot.isConflict && spot.status === "Occupied" && <CarFront className="h-4 w-4 md:h-5 md:w-5 opacity-80" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. SIDE PANEL */}
            {selectedSpot && (
                <div className="w-[360px] lg:w-[420px] h-full bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/5 flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300 relative">

                    {toastMessage && (
                        <div className="absolute top-20 left-4 right-4 bg-emerald-500 text-white font-bold text-sm px-4 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 shrink-0" /> <span className="leading-tight">{toastMessage}</span>
                        </div>
                    )}

                    <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-inner ${selectedSpot.isConflict ? 'bg-purple-600' : selectedSpot.status === 'Free' ? 'bg-emerald-500' : selectedSpot.status === 'Reserved' ? 'bg-yellow-400 text-zinc-900' : 'bg-red-600'}`}>
                                {selectedSpot.isConflict ? <ShieldAlert className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-zinc-900 dark:text-white leading-none">Spot {selectedSpot.id}</h3>
                                <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${selectedSpot.isConflict ? 'text-purple-600 dark:text-purple-400' : selectedSpot.status === 'Free' ? 'text-emerald-500' : selectedSpot.status === 'Reserved' ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-500'}`}>
                                    {selectedSpot.isConflict ? "Squatter Conflict" : selectedSpot.status}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedSpot(null)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer"><X className="h-5 w-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                        {/* CAMERA FEED */}
                        <div className="w-full aspect-video bg-black rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner relative overflow-hidden group">
                            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                                <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                    LIVE CAM-04
                                </div>
                            </div>

                            {selectedSpot.status === "Free" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
                                    <Video className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="text-xs font-medium tracking-wide uppercase">Spot is empty</span>
                                </div>
                            ) : (
                                <div className="w-full h-full relative">
                                    <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=800" alt="Live Car Feed" className="w-full h-full object-cover opacity-70 grayscale-[30%] contrast-125" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className={`w-2/3 h-1/2 border-[3px] rounded-lg relative ${selectedSpot.isConflict ? 'border-purple-500/80' : selectedSpot.isUnregistered && !selectedSpot.actualPlate ? 'border-red-500/80' : 'border-emerald-500/50'}`}>
                                            <span className={`absolute -top-6 left-0 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-t-md ${selectedSpot.isConflict ? 'bg-purple-500 text-white' : selectedSpot.isUnregistered && !selectedSpot.actualPlate ? 'bg-red-500 text-white' : 'bg-emerald-500'}`}>
                                                {selectedSpot.isConflict ? 'UNAUTHORIZED SQUATTER' : selectedSpot.isUnregistered && !selectedSpot.actualPlate ? 'PLATE UNREADABLE' : 'YOLOv8: VEHICLE 98%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ✅ REAL-WORLD SCENARIO 1: SQUATTER CONFLICT (PURPLE UI) */}
                        {selectedSpot.isConflict && (
                            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400">
                                    <Megaphone className="h-5 w-5 shrink-0" />
                                    <span className="font-bold text-sm">Conflict: Squatter Detected</span>
                                </div>

                                <div className="mb-4 space-y-2">
                                    <div className="text-xs p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-500/30">
                                        <span className="font-black">RESERVED FOR:</span> {selectedSpot.expectedDriver.name} (ETA: {selectedSpot.expectedDriver.eta})
                                    </div>
                                </div>

                                {selectedSpot.waitingToMove ? (
                                    <div className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-center px-4 animate-pulse">
                                        <Video className="h-4 w-4 shrink-0 text-zinc-400" /> Awaiting camera confirmation of departure...
                                    </div>
                                ) : selectedSpot.squatterDriver ? (
                                    // Squatter IS registered, they just made a mistake
                                    <div className="space-y-3">
                                        <p className="text-xs text-purple-900 dark:text-purple-300 font-medium">Squatter is a registered driver (<span className="font-bold">{selectedSpot.squatterDriver.plate}</span>). Instruct them to move.</p>
                                        <button onClick={handleInstructToMove} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm">
                                            <Megaphone className="h-4 w-4" /> Tell Driver to Move
                                        </button>
                                    </div>
                                ) : (
                                    // Squatter is UNREGISTERED
                                    <div className="space-y-3">
                                        <p className="text-xs text-purple-900 dark:text-purple-300 font-medium">Squatter is <span className="font-bold">UNREGISTERED</span>.</p>
                                        {suggestedAlternative ? (
                                            <button onClick={handleRedirectSquatter} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm">
                                                <ArrowRight className="h-4 w-4" /> Redirect & Start POS Walk-Up
                                            </button>
                                        ) : (
                                            <div className="bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-sm font-bold text-red-700 dark:text-red-400 text-center">
                                                Lot is completely full. Tell them to leave.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ✅ SCENARIO 2: AI UNRECOGNIZED (Muddy Plate) */}
                        {selectedSpot.isUnregistered && !selectedSpot.isConflict && !selectedSpot.actualPlate && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                                    <ScanFace className="h-5 w-5 shrink-0" />
                                    <span className="font-bold text-sm">AI Unrecognized Vehicle</span>
                                </div>
                                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed mb-4">
                                    License plate cannot be read cleanly by the camera. Please enter it manually to check database. (Tip: Try typing <span className="font-mono font-bold">AA 12345</span> to test registered driver)
                                </p>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Edit className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <input type="text" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase())} placeholder="Enter Plate..." className="w-full h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 placeholder:text-amber-400/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none font-mono font-bold uppercase transition-all" />
                                    </div>
                                    <button onClick={handlePlateOverride} disabled={!manualPlate.trim() || isLookingUp} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-200 dark:disabled:bg-amber-900/50 disabled:text-amber-600/50 text-amber-950 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm cursor-pointer">
                                        {isLookingUp ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        {isLookingUp ? 'Searching Database...' : 'Force Plate Override & Lookup'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* REGISTERED USER DATA */}
                        {selectedSpot.expectedDriver && !selectedSpot.isUnregistered && !selectedSpot.isConflict && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5 pb-2">Registered User Data</h4>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><User className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Full Name</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedSpot.expectedDriver.name}</p>
                                        </div>
                                    </div>
                                    {selectedSpot.expectedDriver.phone && (
                                        <button className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:scale-110 transition-transform outline-none"><Smartphone className="h-4 w-4" /></button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-zinc-50 dark:bg-white/5 p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-500">License Plate</span>
                                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">{selectedSpot.actualPlate || selectedSpot.expectedDriver.plate}</span>
                                    </div>
                                    {selectedSpot.expectedDriver.eta && (
                                        <div className="bg-yellow-50 dark:bg-yellow-500/10 p-3.5 rounded-xl border border-yellow-200 dark:border-yellow-500/20 flex justify-between items-center mt-2">
                                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">Arrival ETA</span>
                                            <span className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">{selectedSpot.expectedDriver.eta}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-b-3xl shrink-0 flex flex-col gap-2">
                        {/* ONLY show POS if we explicitly know the plate AND know they are unregistered */}
                        {selectedSpot.isUnregistered && selectedSpot.actualPlate && !selectedSpot.isConflict ? (
                            <button onClick={handleStartWalkUp} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 text-sm cursor-pointer animate-in zoom-in">
                                <CreditCard className="h-4 w-4" /> Unregistered: Start Walk-Up POS Session
                            </button>
                        ) : selectedSpot.status === "Free" ? (
                            <div className="w-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs text-center px-4">
                                <Video className="h-4 w-4" /> Spot is empty and awaiting next vehicle.
                            </div>
                        ) : !selectedSpot.isConflict && !selectedSpot.isUnregistered ? (
                            <div className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-center px-4">
                                <Lock className="h-4 w-4 shrink-0 text-zinc-400" /> System will automatically clear this spot upon exit.
                            </div>
                        ) : null}
                    </div>

                </div>
            )}

        </div>
    );
}