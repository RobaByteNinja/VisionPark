import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Database, HardDrive, Clock, ShieldAlert,
    RefreshCw, Save, CheckCircle, XCircle, Download,
    AlertTriangle, Server, FileText, Trash2, ChevronDown, X
} from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

// --- MOCK DATA ---
const MOCK_BACKUPS = [
    { id: "BKP-901A", type: "Database", size: "2.4 GB", duration: "4m 12s", trigger: "Scheduled", status: "Success", time: "Today, 03:00 AM" },
    { id: "BKP-900B", type: "Configs", size: "12 MB", duration: "0m 45s", trigger: "Scheduled", status: "Success", time: "Today, 02:00 AM" },
    { id: "BKP-899C", type: "Logs", size: "450 MB", duration: "1m 20s", trigger: "Scheduled", status: "Success", time: "Today, 01:00 AM" },
    { id: "BKP-898D", type: "Database", size: "2.4 GB", duration: "5m 01s", trigger: "Manual", status: "Success", time: "Yesterday, 08:15 PM" },
    { id: "BKP-897E", type: "Configs", size: "12 MB", duration: "0m 02s", trigger: "Scheduled", status: "Failed", time: "Yesterday, 02:00 AM" },
    { id: "BKP-896F", type: "Logs", size: "445 MB", duration: "1m 18s", trigger: "Scheduled", status: "Success", time: "Yesterday, 01:00 AM" },
    { id: "BKP-895G", type: "Database", size: "2.3 GB", duration: "4m 05s", trigger: "Scheduled", status: "Success", time: "Mar 14, 03:00 AM" },
    { id: "BKP-894H", type: "Configs", size: "11 MB", duration: "0m 42s", trigger: "Scheduled", status: "Success", time: "Mar 14, 02:00 AM" },
];

const STORAGE_DATA = [
    { name: "Database", value: 14.5, color: "#6366f1" },
    { name: "System Logs", value: 3.8, color: "#8b5cf6" },
    { name: "Configs", value: 0.4, color: "#a1a1aa" },
];
const TOTAL_STORAGE_GB = 50;
const USED_STORAGE_GB = STORAGE_DATA.reduce((acc, cur) => acc + cur.value, 0);

// Status messages shown as progress advances
const RESTORE_MESSAGES = [
    { at: 0, text: "Halting active edge node connections..." },
    { at: 20, text: "Purging corrupted database state..." },
    { at: 45, text: "Applying snapshot to database..." },
    { at: 70, text: "Verifying data integrity..." },
    { at: 88, text: "Restarting services..." },
    { at: 96, text: "Finalising rollback..." },
];

const getRestoreMessage = (progress) => {
    let msg = RESTORE_MESSAGES[0].text;
    for (const m of RESTORE_MESSAGES) {
        if (progress >= m.at) msg = m.text;
    }
    return msg;
};

// ── TOOLTIP ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const percent = ((data.value / USED_STORAGE_GB) * 100).toFixed(1);
    return (
        <div className="bg-[#1c1c1f] border border-[#3f3f46] p-3 rounded-xl shadow-xl z-50">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                <span className="text-sm font-bold text-zinc-300">{data.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white">{data.value.toFixed(1)} GB</span>
                <span className="text-xs font-medium text-zinc-500">({percent}%)</span>
            </div>
        </div>
    );
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const getBadgeStyle = (type) => {
    if (type === "Database") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    if (type === "Configs") return "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 border-zinc-200 dark:border-white/10";
    return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 border-violet-200 dark:border-violet-500/30";
};

const getTypeIcon = (type) => {
    if (type === "Database") return <Database className="h-3 w-3" />;
    if (type === "Configs") return <Server className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function BackupRecovery() {
    const context = useOutletContext() || {};
    const showToast = context.showToast || ((msg) => console.log(msg));

    // ── state ──────────────────────────────────────────────────────────────────
    const [backups, setBackups] = useState(MOCK_BACKUPS);
    const [isSavingSchedule, setSaving] = useState(false);
    const [showManualModal, setManualModal] = useState(false);
    const [isRunningBackup, setRunningBackup] = useState(false);
    const [backupToDelete, setToDelete] = useState(null);
    const [isDeleting, setDeleting] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [quickRestoringId, setQuickId] = useState(null);
    const [activeDropdown, setDropdown] = useState(null);

    const [schedules, setSchedules] = useState({
        database: { active: true, freq: "Daily", time: "03:00", retention: "30" },
        configs: { active: true, freq: "Hourly", time: "00:00", retention: "7" },
        logs: { active: true, freq: "Daily", time: "01:00", retention: "14" },
    });

    // Restore flow
    const [restoreStep, setRestoreStep] = useState(1);
    const [restoreData, setRestoreData] = useState({ backupId: "", scope: "", confirmText: "" });
    const [restoreProgress, setRestoreProgress] = useState(0);
    const [restoreStatus, setRestoreStatus] = useState("idle"); // idle | running | success | failed
    const [restoreMsg, setRestoreMsg] = useState("");

    // Keep a ref to the interval so we can clear it from anywhere
    const intervalRef = useRef(null);

    // Cleanup interval on unmount
    useEffect(() => () => clearInterval(intervalRef.current), []);

    // ── restore engine ─────────────────────────────────────────────────────────
    const executeRestoreSimulation = () => {
        // Decide outcome once before the interval starts
        const willFail = Math.random() < 0.15;          // 15 % failure rate
        const failAt = Math.floor(Math.random() * 40) + 40; // fail between 40-80 %
        let progress = 0;

        // Transition to step 4 overlay immediately
        setRestoreStep(4);
        setRestoreProgress(0);
        setRestoreStatus("running");
        setRestoreMsg(getRestoreMessage(0));

        // setInterval fires every 400 ms — guaranteed to trigger React re-render
        intervalRef.current = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 4;  // +4..+12 per tick

            // ── FAILURE PATH ──────────────────────────────────────────────────
            if (willFail && progress >= failAt) {
                clearInterval(intervalRef.current);
                setRestoreProgress(failAt);
                setRestoreStatus("failed");
                setRestoreMsg("Checksum mismatch. Rollback aborted to prevent data corruption.");
                showToast("Restore failed: Archive integrity check failed.", "error");
                return;
            }

            // ── SUCCESS PATH ──────────────────────────────────────────────────
            if (progress >= 100) {
                clearInterval(intervalRef.current);
                setRestoreProgress(100);
                setRestoreMsg("System successfully rolled back.");
                // Small delay so the bar visually reaches 100% before switching state
                setTimeout(() => {
                    setRestoreStatus("success");
                    showToast(`System restored successfully from ${restoreData.backupId}.`, "success");
                }, 400);
                return;
            }

            // ── IN-PROGRESS ───────────────────────────────────────────────────
            setRestoreProgress(progress);
            setRestoreMsg(getRestoreMessage(progress));
        }, 400);
    };

    const resetRestoreFlow = () => {
        clearInterval(intervalRef.current);
        setRestoreStep(1);
        setRestoreData({ backupId: "", scope: "", confirmText: "" });
        setRestoreProgress(0);
        setRestoreStatus("idle");
        setRestoreMsg("");
    };

    // ── other handlers ─────────────────────────────────────────────────────────
    const handleSaveSchedule = async () => {
        setSaving(true);
        await delay(1000);
        setSaving(false);
        showToast("Automated backup schedules updated successfully.", "success");
    };

    const handleRunManualBackup = async () => {
        setRunningBackup(true);
        showToast("Starting manual full system backup...", "success");
        await delay(2500);
        setRunningBackup(false);
        setManualModal(false);
        showToast("Manual backup completed successfully.", "success");
        const newBkp = {
            id: `BKP-${Math.floor(100 + Math.random() * 900)}M`,
            type: "Database", size: "2.4 GB", duration: "4m 45s",
            trigger: "Manual", status: "Success", time: "Just Now"
        };
        setBackups(prev => [newBkp, ...prev]);
    };

    const handleDownload = async (bkp) => {
        setDownloadingId(bkp.id);
        await delay(1500);
        setDownloadingId(null);
        const content = `--- VISIONPARK SYSTEM BACKUP ---\nBackup ID: ${bkp.id}\nType: ${bkp.type}\nSize: ${bkp.size}\nTimestamp: ${new Date().toISOString()}\nStatus: Verified\n\n[ENCRYPTED HEX DATA MOCK...]`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `VisionPark_${bkp.id}_${bkp.type}.txt`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast(`Snapshot ${bkp.id} downloaded successfully.`, "success");
    };

    const handleQuickRestore = async (id) => {
        setQuickId(id);
        showToast(`Initiating quick restore for ${id}...`, "success");
        await delay(2500);
        setQuickId(null);
        if (Math.random() > 0.1) {
            showToast(`System restored successfully from ${id}.`, "success");
        } else {
            showToast(`Restore failed for ${id}. Archive integrity check failed.`, "error");
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        await delay(1000);
        setBackups(prev => prev.filter(b => b.id !== backupToDelete));
        if (restoreData.backupId === backupToDelete) resetRestoreFlow();
        showToast(`Backup ${backupToDelete} permanently deleted.`, "success");
        setDeleting(false);
        setToDelete(null);
    };

    const isRestoreValid = restoreData.confirmText === "RESTORE";

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Database className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500" />
                        Backup & Recovery
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Automated backup schedules, restore points, and recovery tools.</p>
                </div>
                <button onClick={() => setManualModal(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-5 py-2.5 rounded-xl font-bold transition-all outline-none active:scale-95 shrink-0 cursor-pointer">
                    <HardDrive className="h-4 w-4" /> Run Manual Backup
                </button>
            </div>

            {/* HEALTH OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Last Successful</p>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-lg font-black text-zinc-900 dark:text-white">Today, 03:00 AM</p>
                        <p className="text-xs font-bold text-zinc-500 mt-0.5">Database Full — 2.4 GB</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Next Scheduled</p>
                        <Clock className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-lg font-black text-zinc-900 dark:text-white">Tomorrow, 03:00 AM</p>
                        <p className="text-xs font-bold text-zinc-500 mt-0.5">Automated Nightly Routine</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Storage Used</p>
                        <HardDrive className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between mb-2">
                            <p className="text-lg font-black text-zinc-900 dark:text-white">{USED_STORAGE_GB.toFixed(1)} GB</p>
                            <p className="text-xs font-bold text-zinc-500">/ {TOTAL_STORAGE_GB} GB</p>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(USED_STORAGE_GB / TOTAL_STORAGE_GB) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN SPLIT */}
            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 relative z-10">

                {/* LEFT: History Table */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    <div className="bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-500" /> Backup History
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Immutable ledger of system snapshots</p>
                        </div>
                        <div className="overflow-x-auto w-full custom-scrollbar flex-1 max-h-[500px] xl:max-h-none">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-black/20">
                                        <th className="px-5 py-4 font-black">Backup ID</th>
                                        <th className="px-5 py-4 font-black">Type</th>
                                        <th className="px-5 py-4 font-black">Size</th>
                                        <th className="px-5 py-4 font-black">Details</th>
                                        <th className="px-5 py-4 font-black">Status</th>
                                        <th className="px-5 py-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {backups.length > 0 ? backups.map((bkp) => {
                                        const isDl = downloadingId === bkp.id;
                                        const isQR = quickRestoringId === bkp.id;
                                        return (
                                            <tr key={bkp.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-4 font-mono font-bold text-zinc-600 dark:text-zinc-300 text-xs whitespace-nowrap">{bkp.id}</td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getBadgeStyle(bkp.type)}`}>
                                                        {getTypeIcon(bkp.type)} {bkp.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{bkp.size}</td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{bkp.time}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">{bkp.duration} • {bkp.trigger}</p>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        {bkp.status === "Success"
                                                            ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                            : <XCircle className="h-4 w-4 text-red-500" />}
                                                        <span className={`text-xs font-bold ${bkp.status === "Success" ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {bkp.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleDownload(bkp)}
                                                            disabled={bkp.status === "Failed" || isDl || isQR}
                                                            className={`p-1.5 rounded-lg border border-transparent transition-all outline-none cursor-pointer
                                                                ${isDl ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-indigo-400'}
                                                                disabled:opacity-30 disabled:cursor-not-allowed`}
                                                            title="Download Snapshot">
                                                            {isDl ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                        </button>
                                                        <button disabled={bkp.status === "Failed" || isDl || isQR}
                                                            onClick={() => handleQuickRestore(bkp.id)}
                                                            className={`p-1.5 rounded-lg border border-transparent transition-all outline-none cursor-pointer
                                                                ${isQR ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' : 'text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:text-zinc-400 dark:hover:text-amber-400'}
                                                                disabled:opacity-30 disabled:cursor-not-allowed`}
                                                            title="Quick Restore">
                                                            {isQR ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                        </button>
                                                        <button disabled={isDl || isQR}
                                                            onClick={() => setToDelete(bkp.id)}
                                                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent transition-all outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Delete Backup">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-12 text-center text-zinc-500">
                                                <HardDrive className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold text-zinc-400">No backup records found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">

                    {/* RESTORE CARD */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-amber-200 dark:border-amber-500/20 flex flex-col overflow-hidden relative min-h-[400px]">

                        {/* ── STEP 4 OVERLAY ────────────────────────────────────── */}
                        {restoreStep === 4 && (
                            <div className="absolute inset-0 bg-white/97 dark:bg-[#121214]/97 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">

                                {/* RUNNING */}
                                {restoreStatus === "running" && (
                                    <div className="w-full flex flex-col items-center">
                                        {/* Spinning ring */}
                                        <div className="relative h-20 w-20 mb-6">
                                            <svg className="absolute inset-0 animate-spin" viewBox="0 0 80 80" fill="none">
                                                <circle cx="40" cy="40" r="34" stroke="#f59e0b" strokeWidth="6" strokeOpacity="0.15" />
                                                <path d="M40 6 A34 34 0 0 1 74 40" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-lg font-black text-amber-500 tabular-nums">{restoreProgress}%</span>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Restoring System</h3>
                                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-6 px-2 min-h-[2rem] transition-all duration-300">
                                            {restoreMsg}
                                        </p>

                                        {/* Progress bar */}
                                        <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden shadow-inner mb-2">
                                            <div
                                                className="h-full rounded-full bg-amber-500 transition-all duration-400 ease-linear"
                                                style={{ width: `${restoreProgress}%` }}
                                            />
                                        </div>

                                        {/* Step labels */}
                                        <div className="flex justify-between w-full text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                            <span>Halt</span>
                                            <span>Purge</span>
                                            <span>Apply</span>
                                            <span>Verify</span>
                                            <span>Done</span>
                                        </div>
                                    </div>
                                )}

                                {/* SUCCESS */}
                                {restoreStatus === "success" && (
                                    <div className="animate-in zoom-in duration-400 flex flex-col items-center w-full">
                                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 shadow-inner">
                                            <CheckCircle className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">System Restored</h3>
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-8">{restoreMsg}</p>
                                        <button onClick={resetRestoreFlow}
                                            className="w-full py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 outline-none active:scale-95 transition-all cursor-pointer">
                                            Acknowledge
                                        </button>
                                    </div>
                                )}

                                {/* FAILED */}
                                {restoreStatus === "failed" && (
                                    <div className="animate-in zoom-in duration-400 flex flex-col items-center w-full">
                                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4 shadow-inner">
                                            <XCircle className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Restore Failed</h3>
                                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-8">{restoreMsg}</p>
                                        <button onClick={resetRestoreFlow}
                                            className="w-full py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white outline-none active:scale-95 transition-all cursor-pointer">
                                            Abort & Retry
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-5 border-b border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-lg font-black text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" /> System Restore
                            </h2>
                            <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest mt-1">Manual Rollback Form</p>
                        </div>

                        <div className="p-5 space-y-6 flex-1">

                            {/* Step 1 */}
                            <div className={`transition-opacity duration-300 ${restoreStep < 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${restoreStep > 1 ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                        {restoreStep > 1 ? <CheckCircle className="h-3.5 w-3.5" /> : "1"}
                                    </div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Select Backup</p>
                                </div>
                                <div className="pl-9 relative">
                                    <button type="button"
                                        onClick={() => setDropdown(activeDropdown === 'restore_select' ? null : 'restore_select')}
                                        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none transition-colors cursor-pointer ${restoreData.backupId ? 'border-amber-400 dark:border-amber-500/50' : 'border-zinc-200 dark:border-white/10 hover:border-amber-500'}`}>
                                        <span className="truncate text-left">
                                            {restoreData.backupId
                                                ? (() => { const b = backups.find(bk => bk.id === restoreData.backupId); return `${b?.id || ''} (${b?.type || ''})`; })()
                                                : "-- Select Snapshot --"}
                                        </span>
                                        <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0 ml-2" />
                                    </button>
                                    {activeDropdown === 'restore_select' && (
                                        <>
                                            <div className="fixed inset-0 z-[90]" onClick={() => setDropdown(null)} />
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[250px]">
                                                <div className="p-1.5 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                                                    {backups.filter(b => b.status === "Success").map(b => (
                                                        <button key={b.id}
                                                            onClick={() => { setRestoreData({ ...restoreData, backupId: b.id }); if (restoreStep === 1) setRestoreStep(2); setDropdown(null); }}
                                                            className={`px-3 py-2.5 text-xs font-mono font-medium rounded-lg text-left transition-colors outline-none flex justify-between shrink-0 cursor-pointer ${restoreData.backupId === b.id ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                            <span>{b.id} ({b.type}) — {b.time}</span>
                                                            {restoreData.backupId === b.id && <CheckCircle className="h-3 w-3 text-amber-500 shrink-0 ml-2" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className={`transition-opacity duration-300 ${restoreStep < 2 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${restoreStep > 2 ? 'bg-emerald-500 text-white' : restoreStep === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-zinc-200 text-zinc-500 dark:bg-white/10 dark:text-zinc-600'}`}>
                                        {restoreStep > 2 ? <CheckCircle className="h-3.5 w-3.5" /> : "2"}
                                    </div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Restore Scope</p>
                                </div>
                                <div className="pl-9 flex gap-2">
                                    {["Full System", "Data Only", "Config Only"].map(scope => (
                                        <button key={scope}
                                            onClick={() => { setRestoreData({ ...restoreData, scope }); if (restoreStep === 2) setRestoreStep(3); }}
                                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors outline-none cursor-pointer ${restoreData.scope === scope ? 'bg-amber-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}>
                                            {scope.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className={`transition-opacity duration-300 ${restoreStep < 3 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${restoreStep === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-zinc-200 text-zinc-500 dark:bg-white/10 dark:text-zinc-600'}`}>
                                        3
                                    </div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Confirm Authorization</p>
                                </div>
                                <div className="pl-9">
                                    <input type="text"
                                        value={restoreData.confirmText}
                                        onChange={(e) => setRestoreData({ ...restoreData, confirmText: e.target.value.toUpperCase() })}
                                        placeholder="Type RESTORE to confirm"
                                        className={`w-full bg-zinc-50 dark:bg-black/40 border rounded-xl px-3 py-2.5 text-xs font-mono font-black text-center outline-none transition-colors uppercase tracking-widest
                                            ${restoreData.confirmText.length > 0
                                                ? (isRestoreValid ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-red-500 text-red-600 dark:text-red-400')
                                                : 'border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:border-amber-500'}`}
                                    />
                                    <button onClick={executeRestoreSimulation}
                                        disabled={!isRestoreValid}
                                        className="w-full mt-3 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed cursor-pointer">
                                        <AlertTriangle className="h-4 w-4" /> Execute Rollback
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STORAGE CHART */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl p-5 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-indigo-500" /> Vault Breakdown
                            </h2>
                        </div>
                        <div className="relative h-[200px] w-full">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={STORAGE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {STORAGE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-zinc-900 dark:text-white">{USED_STORAGE_GB.toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">GB Total</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            {STORAGE_DATA.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="font-bold text-zinc-600 dark:text-zinc-400">{item.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-zinc-900 dark:text-white">{item.value.toFixed(1)} GB</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SCHEDULE CARD */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-500" /> Automation Rules
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Snapshot Scheduling</p>
                        </div>
                        <div className="p-5 space-y-5">
                            {Object.keys(schedules).map((key) => {
                                const cfg = schedules[key];
                                const title = key === 'database' ? "Database Full" : key === 'configs' ? "Edge Configs" : "System Logs";
                                const Icon = key === 'database' ? Database : key === 'configs' ? Server : FileText;
                                return (
                                    <div key={key} className="space-y-2 pb-5 border-b border-zinc-100 dark:border-white/5 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-md flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{title}</span>
                                            </div>
                                            <button onClick={() => setSchedules({ ...schedules, [key]: { ...cfg, active: !cfg.active } })}
                                                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-200 ${cfg.active ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                                <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${cfg.active ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
                                            </button>
                                        </div>
                                        <div className={`grid grid-cols-3 gap-2 transition-opacity ${!cfg.active ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                            <div className="relative">
                                                <button type="button"
                                                    onClick={() => setDropdown(activeDropdown === `${key}_freq` ? null : `${key}_freq`)}
                                                    className="w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 outline-none hover:border-indigo-500 transition-colors cursor-pointer">
                                                    <span className="truncate pr-1">{cfg.freq}</span>
                                                    <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                                                </button>
                                                {activeDropdown === `${key}_freq` && (
                                                    <>
                                                        <div className="fixed inset-0 z-[90]" onClick={() => setDropdown(null)} />
                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#18181b] rounded-lg shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in duration-200 flex flex-col">
                                                            <div className="p-1 flex flex-col">
                                                                {["Hourly", "Daily", "Weekly"].map(opt => (
                                                                    <button key={opt} onClick={() => { setSchedules({ ...schedules, [key]: { ...cfg, freq: opt } }); setDropdown(null); }}
                                                                        className={`px-2 py-1.5 text-[10px] font-medium rounded text-left transition-colors outline-none cursor-pointer ${cfg.freq === opt ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <input type="time" value={cfg.time}
                                                onChange={(e) => setSchedules({ ...schedules, [key]: { ...cfg, time: e.target.value } })}
                                                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:border-indigo-500" />
                                            <div className="relative">
                                                <button type="button"
                                                    onClick={() => setDropdown(activeDropdown === `${key}_ret` ? null : `${key}_ret`)}
                                                    className="w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 outline-none hover:border-indigo-500 transition-colors cursor-pointer">
                                                    <span className="truncate pr-1">{cfg.retention}d</span>
                                                    <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                                                </button>
                                                {activeDropdown === `${key}_ret` && (
                                                    <>
                                                        <div className="fixed inset-0 z-[90]" onClick={() => setDropdown(null)} />
                                                        <div className="absolute right-0 w-[110px] top-full mt-1 bg-white dark:bg-[#18181b] rounded-lg shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in duration-200 flex flex-col">
                                                            <div className="p-1 flex flex-col">
                                                                {[7, 14, 30].map(opt => (
                                                                    <button key={opt} onClick={() => { setSchedules({ ...schedules, [key]: { ...cfg, retention: opt.toString() } }); setDropdown(null); }}
                                                                        className={`px-2 py-1.5 text-[10px] font-medium rounded text-left transition-colors outline-none cursor-pointer ${cfg.retention === opt.toString() ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                                        Keep {opt} Days
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-5 pt-0 shrink-0">
                            <button onClick={handleSaveSchedule} disabled={isSavingSchedule}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                                {isSavingSchedule ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSavingSchedule ? "Saving..." : "Save Schedules"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE MODAL */}
            {backupToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setToDelete(null)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mb-6 shadow-inner">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-2">Delete Snapshot?</h2>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                            Permanently delete backup <strong className="text-zinc-900 dark:text-white font-mono">{backupToDelete}</strong>. This cannot be undone.
                        </p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => setToDelete(null)} disabled={isDeleting}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95 cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={isDeleting}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                                {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MANUAL BACKUP MODAL */}
            {showManualModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isRunningBackup && setManualModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        {isRunningBackup ? (
                            <>
                                <RefreshCw className="h-16 w-16 text-indigo-500 animate-spin mb-6" />
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Backing up system...</h2>
                                <p className="text-sm font-medium text-zinc-500 mb-2">Creating secure snapshot of Database, Configs, and Logs.</p>
                                <p className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest">Please do not close window</p>
                            </>
                        ) : (
                            <>
                                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-inner">
                                    <HardDrive className="h-8 w-8" />
                                </div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Run Manual Backup?</h2>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                                    This will create an immediate, off-cycle full system snapshot. May cause a brief spike in database latency.
                                </p>
                                <div className="flex w-full gap-3">
                                    <button onClick={() => setManualModal(false)}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95 cursor-pointer">
                                        Cancel
                                    </button>
                                    <button onClick={handleRunManualBackup}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                                        Start Backup
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}