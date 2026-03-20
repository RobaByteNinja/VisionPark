import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    Wallet, Clock, Banknote, ArrowRight,
    CheckCircle, AlertTriangle, Calculator,
    LogOut, FileText, ShieldCheck, Lock,
    ReceiptText, Printer, XCircle, Download
} from "lucide-react";

// --- MOCK SHIFT DATA ---
const EXPECTED_CASH = 2450.00;
const SHIFT_START_TIME = "06:00 AM";
const ATTENDANT_ID = "OP-4092";

const RECENT_CASH_LOGS = [
    { id: "TRX-091", type: "Walk-Up Deposit", amount: 60, time: "10:15 AM", plate: "AA 45892" },
    { id: "OV-102", type: "Overstay Fine (Manual)", amount: 85, time: "09:30 AM", plate: "UN 99321" },
    { id: "TRX-088", type: "Walk-Up Deposit", amount: 120, time: "08:45 AM", plate: "OR 12904" },
    { id: "TRX-082", type: "Walk-Up Deposit", amount: 40, time: "07:10 AM", plate: "AA 11223" },
];

export default function Shift() {
    const navigate = useNavigate();

    const [shiftState, setShiftState] = useState("active");
    const [actualCashInput, setActualCashInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [zReport, setZReport] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (shiftState === "active") {
            const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
            return () => clearInterval(timer);
        }
    }, [shiftState]);

    const handleStartShift = () => setShiftState("active");
    const handleInitiateClose = () => setShiftState("closing");

    const generateZReport = () => {
        if (!actualCashInput) return alert("Please enter the physical cash amount.");
        setIsSubmitting(true);
        const actualCash = parseFloat(actualCashInput) || 0;
        const variance = actualCash - EXPECTED_CASH;
        setTimeout(() => {
            setZReport({
                id: `Z-${Math.floor(10000 + Math.random() * 90000)}`,
                date: new Date().toLocaleDateString(),
                endTime: new Date().toLocaleTimeString(),
                expected: EXPECTED_CASH,
                actual: actualCash,
                variance,
                status: variance === 0 ? "EXACT MATCH" : variance > 0 ? "OVERAGE" : "SHORTAGE",
                transactions: RECENT_CASH_LOGS.length + 38
            });
            setIsSubmitting(false);
            setShiftState("completed");
        }, 1500);
    };

    const handleSignOut = () => navigate("/");

    const handleCancelZReport = () => {
        setShiftState("active");
        setActualCashInput("");
        setZReport(null);
    };

    const executeDownloadPDF = () => {
        setIsDownloading(true);
        setTimeout(() => setIsDownloading(false), 1500);
    };

    // ── PRE-SHIFT ─────────────────────────────────────────────────────────────
    if (shiftState === "pre-shift") {
        return (
            <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-white dark:bg-[#121214] rounded-3xl shadow-xl border border-zinc-200 dark:border-white/5 p-8 text-center flex flex-col items-center">
                    <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <Clock className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Start Your Shift</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8">
                        Ensure your cash drawer is empty (0.00 ETB) before starting a new session.
                    </p>
                    <button onClick={handleStartShift}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-lg py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none cursor-pointer">
                        Clock In & Open Register
                    </button>
                </div>
            </div>
        );
    }

    // ── Z-REPORT — mounted via createPortal so it escapes the attendant layout
    //    and is never clipped by the nav or the outlet container.
    if (shiftState === "completed" && zReport) {
        const isExact = zReport.variance === 0;
        const isShort = zReport.variance < 0;

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="max-w-md w-full bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl flex flex-col border border-transparent dark:border-white/10 overflow-hidden max-h-[95dvh] overflow-y-auto">

                    {/* Header */}
                    <div className="bg-emerald-500 p-8 pt-10 flex flex-col items-center justify-center text-zinc-950 relative shrink-0">
                        <h2 className="text-3xl font-black font-mono tracking-tight mb-1">VisionPark</h2>
                        <p className="font-bold text-xs opacity-80 uppercase tracking-widest mb-4">Bole Premium Lot</p>
                        <h1 className="text-xl font-black bg-white/20 px-4 py-2 rounded-lg tracking-widest uppercase shadow-sm">End of Shift Z-Report</h1>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-8 pt-6 font-mono bg-zinc-50 dark:bg-[#121214] shrink-0">
                        <div className="space-y-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-6">
                            <div className="flex justify-between"><span>REPORT ID:</span> <span className="text-zinc-900 dark:text-white">{zReport.id}</span></div>
                            <div className="flex justify-between"><span>DATE:</span>      <span className="text-zinc-900 dark:text-white">{zReport.date}</span></div>
                            <div className="flex justify-between"><span>OPENED:</span>    <span className="text-zinc-900 dark:text-white">{SHIFT_START_TIME}</span></div>
                            <div className="flex justify-between"><span>CLOSED:</span>    <span className="text-zinc-900 dark:text-white">{zReport.endTime}</span></div>
                            <div className="flex justify-between"><span>OPERATOR:</span>  <span className="text-zinc-900 dark:text-white">{ATTENDANT_ID}</span></div>
                        </div>

                        <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 pt-6 space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                <span>CASH TRANSACTIONS</span>
                                <span className="text-zinc-900 dark:text-white">{zReport.transactions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">SYSTEM EXPECTED</span>
                                <span className="text-xl font-black text-zinc-900 dark:text-white">{zReport.expected.toFixed(2)} ETB</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">DECLARED CASH</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{zReport.actual.toFixed(2)} ETB</span>
                            </div>
                            <div className={`flex justify-between items-center text-xl font-black p-3 mt-4 rounded-lg border-2 ${isExact ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : isShort ? 'border-red-500 text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400' : 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                                <span className="text-sm">VARIANCE</span>
                                <span>{zReport.variance > 0 ? '+' : ''}{zReport.variance.toFixed(2)} ETB</span>
                            </div>
                            <div className={`text-center font-black tracking-widest uppercase text-sm mt-4 ${isExact ? 'text-emerald-600 dark:text-emerald-500' : isShort ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-500'}`}>
                                *** {zReport.status} ***
                            </div>
                        </div>

                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center font-bold uppercase tracking-widest mt-8">
                            Report automatically synced to Admin Ledger.
                        </p>
                    </div>

                    {/* Jagged edge */}
                    <div className="w-full h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDYsMCAxMiwxMCAxMiwxMCAwLDEwIiBmaWxsPSIjZjlmYWZiIi8+PC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDYsMCAxMiwxMCAxMiwxMCAwLDEwIiBmaWxsPSIjMTIxMjE0Ii8+PC9zdmc+')] shrink-0" />

                    {/* Actions */}
                    <div className="bg-zinc-100 dark:bg-[#18181b] p-4 flex flex-col gap-3 shrink-0">
                        <div className="flex gap-2">
                            <button onClick={handleCancelZReport}
                                className="flex-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold py-3.5 rounded-xl active:scale-95 transition-all outline-none flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-sm">
                                <XCircle className="h-4 w-4" /> Cancel
                            </button>
                            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all outline-none flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-sm">
                                <Printer className="h-4 w-4" /> Print
                            </button>
                            <button onClick={executeDownloadPDF} disabled={isDownloading}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all outline-none flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-sm">
                                <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                                {isDownloading ? 'Saving...' : 'Save PDF'}
                            </button>
                        </div>
                        <button onClick={handleSignOut}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all outline-none cursor-pointer flex items-center justify-center gap-2">
                            <LogOut className="h-5 w-5" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // ── ACTIVE / CLOSING ──────────────────────────────────────────────────────
    return (
        <div className="h-full w-full flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 relative">

            {/* LEFT: Shift Dashboard */}
            <div className="flex-1 xl:max-w-[65%] flex flex-col gap-6">
                <div className="bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 shrink-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                            <ReceiptText className="h-7 w-7 text-emerald-500" /> Shift Management
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your active till and Z-Report closing.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle className="h-5 w-5" /> Shift Active
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 p-6 md:p-8 flex flex-col relative overflow-hidden">
                    {shiftState === "active" ? (
                        <div className="space-y-8 flex-1 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Shift Started</p>
                                    <p className="text-xl font-black text-zinc-900 dark:text-white">{SHIFT_START_TIME}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Current Time</p>
                                    <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">{currentTime}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100 dark:border-white/5 pb-2">Shift Activity Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                                        <p className="text-xs font-bold text-zinc-500 mb-2">Total Walk-Ups</p>
                                        <p className="text-3xl font-black text-zinc-900 dark:text-white">42</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                                        <p className="text-xs font-bold text-zinc-500 mb-2">Manual Override Fines</p>
                                        <p className="text-3xl font-black text-zinc-900 dark:text-white">3</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto pt-8">
                                <button onClick={handleInitiateClose}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-3 cursor-pointer">
                                    <ReceiptText className="h-6 w-6" /> Generate Z-Report & Close Shift
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* BLIND CLOSE FORM */
                        <div className="space-y-6 flex-1 animate-in slide-in-from-right-8 duration-300 flex flex-col justify-center max-w-sm mx-auto w-full">
                            <div className="text-center mb-4">
                                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                    <Calculator className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Z-Report Reconciliation</h3>
                                <p className="text-sm text-zinc-500 font-medium">Count the physical cash in your drawer and enter the exact total to finalize your Z-Read.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                    <Banknote className="h-4 w-4" /> Physical Cash Total (ETB)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="font-black text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors">ETB</span>
                                    </div>
                                    <input type="text" inputMode="decimal"
                                        value={actualCashInput}
                                        onChange={(e) => setActualCashInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                        placeholder="0.00"
                                        className="w-full h-16 pl-16 pr-4 rounded-xl bg-zinc-50 dark:bg-black/40 border-2 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:bg-emerald-50 dark:focus:bg-emerald-500/10 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] font-mono font-black text-2xl tracking-wider transition-all"
                                        autoFocus />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleCancelZReport}
                                    className="flex-1 py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-bold transition-colors outline-none cursor-pointer shadow-sm active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={generateZReport}
                                    disabled={isSubmitting || !actualCashInput}
                                    className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-emerald-950 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
                                    {isSubmitting
                                        ? <span className="animate-pulse">Generating Z-Report...</span>
                                        : <><CheckCircle className="h-5 w-5" /> Submit & Close</>}
                                </button>
                            </div>
                            <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex gap-3 text-xs font-medium text-zinc-500">
                                <Lock className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
                                <p>System expected totals are hidden for security. Variances will be logged automatically on the final report.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cash Log */}
            <div className="w-full xl:w-[35%] h-[600px] xl:h-auto bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col shrink-0">
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-inner">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-zinc-900 dark:text-white leading-none">Cash Log</h3>
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1">This Session</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                    {RECENT_CASH_LOGS.map((log, index) => (
                        <div key={index} className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
                            <div>
                                <span className="font-mono font-black text-sm text-zinc-900 dark:text-white">{log.plate}</span>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{log.type}</p>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {log.time}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-emerald-600 dark:text-emerald-400">+{log.amount.toFixed(2)} ETB</span>
                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">{log.id}</p>
                            </div>
                        </div>
                    ))}
                    <div className="pt-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of recent logs</p>
                    </div>
                </div>
            </div>
        </div>
    );
}