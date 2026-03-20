import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Bell, Activity, Cpu, Server, ShieldAlert, CreditCard,
    Save, RefreshCw, CheckCircle, AlertTriangle, XCircle,
    ChevronDown, ChevronUp, BellRing, Mail, Smartphone,
    Link, History, Check
} from "lucide-react";

// --- DEFAULT CONFIGURATIONS ---
const DEFAULT_THRESHOLDS = {
    nodeHealth: { offlineMin: 5, highPingMs: 300, critPingMs: 500, uptimeWarnPct: 95, cpuWarnPct: 80, memWarnPct: 85 },
    aiPerformance: { ocrWarnPct: 90, ocrCritPct: 80, inferenceMs: 200, queueWarn: 100 },
    financial: { failTxnHr: 10, gatewayDownMin: 2, highRevAnomPct: 200, lowRevAnomPct: 50 },
    security: { failLogin10m: 5, sessionHrWarn: 12, concurrentUser: 3 }
};

const DEFAULT_ROUTING = {
    nodeHealth: { inApp: true, email: true, sms: false, webhook: false, webhookUrl: "" },
    aiPerformance: { inApp: true, email: false, sms: false, webhook: false, webhookUrl: "" },
    financial: { inApp: true, email: true, sms: true, webhook: true, webhookUrl: "https://api.visionpark.et/alerts/fin" },
    security: { inApp: true, email: true, sms: true, webhook: false, webhookUrl: "" }
};

// --- MOCK DATA ---
const MOCK_CURRENT_STATE = {
    "NODE-DD-01_ping": 345,
    "NODE-AA-03_mem": 83,
    "Gateway_failures": 12,
};

const MOCK_ALERT_HISTORY = [
    { id: "ALT-991", type: "High Ping Warning", source: "NODE-DD-01", time: "10 mins ago", threshold: "> 300ms", actual: "345ms", resolved: false, sev: "Warning" },
    { id: "ALT-990", type: "Memory Usage Warning", source: "NODE-AA-03", time: "25 mins ago", threshold: "> 85%", actual: "88%", resolved: true, sev: "Warning" },
    { id: "ALT-989", type: "Gateway Downtime", source: "Telebirr", time: "1 day ago", threshold: "> 2 mins", actual: "4.5 mins", resolved: true, sev: "Critical" },
    { id: "ALT-988", type: "Failed Login Alert", source: "Admin Portal", time: "2 days ago", threshold: "> 5/10m", actual: "7 attempts", resolved: true, sev: "Critical" },
    { id: "ALT-987", type: "Offline Node", source: "NODE-AD-01", time: "3 days ago", threshold: "> 5 mins", actual: "12 mins", resolved: true, sev: "Critical" },
];

export default function AlertThresholds() {
    const context = useOutletContext() || {};
    const showToast = context.showToast || ((msg, type) => alert(`[${type.toUpperCase()}] ${msg}`));

    const [thresholds, setThresholds] = useState(JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)));
    const [routing, setRouting] = useState(JSON.parse(JSON.stringify(DEFAULT_ROUTING)));
    const [activeSection, setActiveSection] = useState("nodeHealth");
    const [isSaving, setIsSaving] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const hasUnsavedChanges =
        JSON.stringify(thresholds) !== JSON.stringify(DEFAULT_THRESHOLDS) ||
        JSON.stringify(routing) !== JSON.stringify(DEFAULT_ROUTING);

    // --- HANDLERS ---
    const handleThresholdChange = (category, key, value) => {
        const numVal = value === "" ? "" : Number(value);
        setThresholds(prev => ({ ...prev, [category]: { ...prev[category], [key]: numVal } }));
    };

    const handleRoutingChange = (category, key, value) => {
        setRouting(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
    };

    const handleSave = () => {
        let isValid = true;
        Object.keys(thresholds).forEach(cat => {
            Object.keys(thresholds[cat]).forEach(key => {
                if (thresholds[cat][key] === "" || thresholds[cat][key] < 0) isValid = false;
            });
        });
        if (!isValid) {
            showToast("Please ensure all threshold values are valid positive numbers.", "error");
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast("Alert thresholds and routing preferences saved successfully.", "success");
        }, 1200);
    };

    const confirmReset = () => {
        setThresholds(JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)));
        setRouting(JSON.parse(JSON.stringify(DEFAULT_ROUTING)));
        setShowResetConfirm(false);
        showToast("Configurations reset to system defaults.", "success");
    };

    // --- RENDER HELPERS ---

    /**
     * FIX 3: Threshold input row
     * - Label column is flex-1 min-w-0 and uses `break-words` so long labels wrap instead of pushing input off-screen
     * - Input+unit group is `shrink-0` so it never squishes below its natural size
     * - On mobile the row is `flex-col`; label is full-width, input group aligns to the end
     * - On sm+ the row becomes `flex-row items-center`
     */
    const renderInputRow = (category, key, label, min, max, unit) => {
        const val = thresholds[category][key];
        const defaultVal = DEFAULT_THRESHOLDS[category][key];
        const isChanged = val !== defaultVal;
        const isInvalid = val === "" || val < min || (max && val > max);

        return (
            <div
                key={key}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-colors
                    ${isChanged
                        ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-l-4 border-indigo-500"
                        : "bg-zinc-50 dark:bg-white/5 border-l-4 border-transparent hover:bg-zinc-100 dark:hover:bg-white/10"
                    }`}
            >
                {/* Label + default hint — full width on mobile, flex-1 on sm+ */}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white leading-snug break-words">
                        {label}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                        Default: {defaultVal}{unit}
                    </span>
                </div>

                {/* Input + unit — shrink-0 so it never collapses; self-end on mobile so it right-aligns */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <input
                        type="number" min={min} max={max} value={val}
                        onChange={e => handleThresholdChange(category, key, e.target.value)}
                        className={`w-20 sm:w-24 bg-white dark:bg-[#121214] border rounded-lg px-3 py-2 text-sm font-mono font-black text-right outline-none transition-colors
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                            ${isInvalid
                                ? "border-red-500 focus:border-red-500 text-red-600"
                                : "border-zinc-200 dark:border-white/10 focus:border-indigo-500 text-zinc-900 dark:text-white"
                            }`}
                    />
                    <span className="text-xs font-bold text-zinc-500 w-7 sm:w-8 shrink-0">{unit}</span>
                </div>
            </div>
        );
    };

    /**
     * FIX: CustomCheckbox — `items-start` always (not sm:items-center) so
     * the checkbox aligns with the first line of text on all screen sizes.
     * Label text uses `break-words` and `leading-tight` to wrap gracefully.
     */
    const CustomCheckbox = ({ checked, onChange, icon: Icon, label }) => (
        <label
            className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all group
                ${checked
                    ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                    : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                }`}
        >
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
            {/* Custom visual checkbox — mt-0.5 keeps it aligned with first text line */}
            <div
                className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded shrink-0 transition-all
                    ${checked
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white dark:bg-[#121214] border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-indigo-400"
                    }`}
            >
                {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
            </div>
            {/* Icon + label text */}
            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${checked ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                <span className={`text-xs font-bold break-words leading-tight ${checked ? "text-indigo-900 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {label}
                </span>
            </div>
        </label>
    );

    /**
     * FIX 4: Routing config grid
     * - `grid-cols-1 sm:grid-cols-2` always — prevents cramped 4-col layout at xl
     *   inside a flex panel that may only be ~600px wide.
     * - At 2xl screens (≥1536px) we allow 4 columns.
     */
    const renderRoutingConfig = (category) => {
        const route = routing[category];
        return (
            <div className="mt-5 p-4 sm:p-5 bg-white dark:bg-[#18181b] rounded-2xl border border-zinc-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="break-words">Alert Routing Preferences</span>
                </h4>

                {/* FIX 4: 1 col on mobile, 2 cols on sm+, 4 cols only at 2xl */}
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
                    <CustomCheckbox checked={route.inApp} onChange={val => handleRoutingChange(category, "inApp", val)} icon={Bell} label="In-App Alerts" />
                    <CustomCheckbox checked={route.email} onChange={val => handleRoutingChange(category, "email", val)} icon={Mail} label="Email Admin" />
                    <CustomCheckbox checked={route.sms} onChange={val => handleRoutingChange(category, "sms", val)} icon={Smartphone} label="SMS (Ethio Tel)" />
                    <CustomCheckbox checked={route.webhook} onChange={val => handleRoutingChange(category, "webhook", val)} icon={Link} label="Ext. Webhook" />
                </div>

                {route.webhook && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                            Webhook Endpoint URL
                        </label>
                        <input
                            type="url"
                            placeholder="https://your-domain.com/webhook"
                            value={route.webhookUrl}
                            onChange={e => handleRoutingChange(category, "webhookUrl", e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono font-medium text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                )}
            </div>
        );
    };

    // --- ACCORDION SECTION FACTORY ---
    const sections = [
        {
            key: "nodeHealth",
            icon: Server,
            label: "Node Health Thresholds",
            rows: [
                ["offlineMin", "Offline Node Alert", 1, 60, "min"],
                ["highPingMs", "High Ping Warning", 50, 1000, "ms"],
                ["critPingMs", "Critical Ping Alert", 100, 2000, "ms"],
                ["uptimeWarnPct", "Uptime Drop Warning", 50, 100, "%"],
                ["cpuWarnPct", "High CPU Usage Warning", 10, 100, "%"],
                ["memWarnPct", "High Memory Usage Warning", 10, 100, "%"],
            ],
        },
        {
            key: "aiPerformance",
            icon: Cpu,
            label: "AI Performance Thresholds",
            rows: [
                ["ocrWarnPct", "OCR Confidence Warning (Below)", 10, 99, "%"],
                ["ocrCritPct", "OCR Confidence Critical (Below)", 10, 99, "%"],
                ["inferenceMs", "High Inference Time Warning", 50, 2000, "ms"],
                ["queueWarn", "Processing Queue Backlog Warning", 10, 1000, "req"],
            ],
        },
        {
            key: "financial",
            icon: CreditCard,
            label: "Financial Thresholds",
            rows: [
                ["failTxnHr", "Failed Transactions (Per Hour)", 1, 100, "txn"],
                ["gatewayDownMin", "Gateway Downtime Alert", 1, 60, "min"],
                ["highRevAnomPct", "High Revenue Anomaly (Above Avg)", 100, 1000, "%"],
                ["lowRevAnomPct", "Low Revenue Anomaly (Below Avg)", 10, 99, "%"],
            ],
        },
        {
            key: "security",
            icon: ShieldAlert,
            label: "Security Thresholds",
            rows: [
                ["failLogin10m", "Failed Logins (Per 10 Mins)", 1, 50, "att"],
                ["sessionHrWarn", "Max Session Duration Warning", 1, 72, "hr"],
                ["concurrentUser", "Concurrent Sessions Per User", 1, 10, "ses"],
            ],
        },
    ];

    return (
        <div className="w-full flex flex-col gap-5 sm:gap-6 animate-in fade-in duration-500 pb-10">

            {/* ── 1. HEADER ───────────────────────────────────────────────────────
                FIX 1: Title and "Unsaved" badge are on the same flex-wrap row,
                so the badge drops to a new line before ever pushing the title
                text off the right edge on narrow screens.
                FIX 2: Action buttons are full-width on mobile, auto-width on sm+.
            ──────────────────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">

                <div className="flex-1 min-w-0">
                    {/* Title row — flex-wrap so the badge wraps under the icon+text on very narrow screens */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3 min-w-0">
                            <Bell className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500 shrink-0" />
                            <span className="break-words">Alert Thresholds</span>
                        </h1>
                        {hasUnsavedChanges && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Configure trigger points for system alerts and automated responses.
                    </p>
                </div>

                {/* Action buttons — stack on mobile, side-by-side on sm+ */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        disabled={!hasUnsavedChanges}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-sm bg-white dark:bg-[#18181b] border-2 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center whitespace-nowrap"
                    >
                        Reset Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale whitespace-nowrap"
                    >
                        {isSaving ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* ── MAIN BODY ────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">

                {/* LEFT COLUMN — Threshold accordion sections */}
                <div className="flex-[1.5] flex flex-col gap-4 min-w-0">
                    {sections.map(({ key, icon: Icon, label, rows }) => {
                        const open = activeSection === key;
                        return (
                            <div
                                key={key}
                                className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all"
                            >
                                {/* ── Accordion toggle button
                                    FIX 7: min-w-0 + flex-1 on text container prevents the label
                                    from pushing the chevron off-screen on narrow devices.
                                ── */}
                                <button
                                    onClick={() => setActiveSection(open ? "" : key)}
                                    className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 outline-none transition-colors
                                        ${open
                                            ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-b border-indigo-100 dark:border-indigo-500/10"
                                            : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                            ${open
                                                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                                                : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        {/* min-w-0 + text-left so long names wrap within their column */}
                                        <h2 className={`text-sm font-black uppercase tracking-widest text-left break-words min-w-0 transition-colors
                                            ${open ? "text-indigo-900 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"}`}
                                        >
                                            {label}
                                        </h2>
                                    </div>
                                    {open
                                        ? <ChevronUp className="h-5 w-5 text-indigo-500 shrink-0" />
                                        : <ChevronDown className="h-5 w-5 text-zinc-400  shrink-0" />
                                    }
                                </button>

                                {open && (
                                    <div className="p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-2 sm:space-y-3">
                                            {rows.map(([field, rowLabel, min, max, unit]) =>
                                                renderInputRow(key, field, rowLabel, min, max, unit)
                                            )}
                                        </div>
                                        {renderRoutingConfig(key)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT COLUMN — Preview & History
                    FIX 6: Removed `shrink-0` and replaced fixed `lg:max-w-[450px]`
                    with `lg:w-[420px]` so the right panel has a sensible fixed width
                    on desktop but the left panel can breathe. On mobile/tablet both
                    panels stack full-width.
                ── */}
                <div className="w-full lg:w-[420px] flex flex-col gap-5 sm:gap-6 lg:shrink-0">

                    {/* Active Triggers Preview */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b]">
                            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-amber-500 shrink-0" />
                                Active Triggers Preview
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                If saved now, these would fire:
                            </p>
                        </div>

                        <div className="p-4 sm:p-5 flex flex-col gap-3">
                            {/* Trigger: high ping */}
                            {MOCK_CURRENT_STATE["NODE-DD-01_ping"] > thresholds.nodeHealth.highPingMs && (
                                <div className={`p-4 rounded-2xl border-l-4 flex items-start gap-3
                                    bg-amber-50 dark:bg-amber-500/5
                                    ${MOCK_CURRENT_STATE["NODE-DD-01_ping"] > thresholds.nodeHealth.critPingMs
                                        ? "border-red-500" : "border-amber-500"}`}
                                >
                                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5
                                        ${MOCK_CURRENT_STATE["NODE-DD-01_ping"] > thresholds.nodeHealth.critPingMs
                                            ? "text-red-500" : "text-amber-500"}`}
                                    />
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">
                                            High Ping: NODE-DD-01
                                        </h4>
                                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Current: <span className="font-mono font-bold">{MOCK_CURRENT_STATE["NODE-DD-01_ping"]}ms</span>
                                            {" "}(Threshold: {thresholds.nodeHealth.highPingMs}ms)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Trigger: high memory */}
                            {MOCK_CURRENT_STATE["NODE-AA-03_mem"] > thresholds.nodeHealth.memWarnPct && (
                                <div className="p-4 rounded-2xl border-l-4 bg-amber-50 dark:bg-amber-500/5 border-amber-500 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">
                                            High Memory: NODE-AA-03
                                        </h4>
                                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Current: <span className="font-mono font-bold">{MOCK_CURRENT_STATE["NODE-AA-03_mem"]}%</span>
                                            {" "}(Threshold: {thresholds.nodeHealth.memWarnPct}%)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Trigger: gateway failures */}
                            {MOCK_CURRENT_STATE["Gateway_failures"] > thresholds.financial.failTxnHr && (
                                <div className="p-4 rounded-2xl border-l-4 bg-red-50 dark:bg-red-500/5 border-red-500 flex items-start gap-3">
                                    <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">
                                            Gateway Txn Failures
                                        </h4>
                                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Current: <span className="font-mono font-bold">{MOCK_CURRENT_STATE["Gateway_failures"]}/hr</span>
                                            {" "}(Threshold: {thresholds.financial.failTxnHr}/hr)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* All clear */}
                            {!(MOCK_CURRENT_STATE["NODE-DD-01_ping"] > thresholds.nodeHealth.highPingMs) &&
                                !(MOCK_CURRENT_STATE["NODE-AA-03_mem"] > thresholds.nodeHealth.memWarnPct) &&
                                !(MOCK_CURRENT_STATE["Gateway_failures"] > thresholds.financial.failTxnHr) && (
                                    <div className="text-center py-6">
                                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Active Triggers</p>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Alert History
                        FIX 5: Removed the redundant `pl-4 sm:pl-4` → now just `pl-4`.
                        FIX 5: `flex-col sm:flex-row` header within each item is preserved —
                        time stamp wraps below the title on mobile, same row on sm+.
                    ── */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500 shrink-0" /> Alert History
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Past 7 Days</p>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar max-h-[480px] lg:max-h-none">
                            {MOCK_ALERT_HISTORY.map(alert => (
                                <div
                                    key={alert.id}
                                    className="p-4 border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    {/* Row 1: type + timestamp */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <div className={`h-2 w-2 rounded-full shrink-0 mt-1.5
                                                ${alert.sev === "Critical"
                                                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                                    : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                                }`}
                                            />
                                            <span className="text-xs font-bold text-zinc-900 dark:text-white break-words leading-snug">
                                                {alert.type}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono font-medium text-zinc-500 shrink-0 pl-4 sm:pl-0">
                                            {alert.time}
                                        </span>
                                    </div>

                                    {/* Row 2: details — FIX 5: single `pl-4` (no redundant sm:pl-4) */}
                                    <div className="pl-4 flex flex-col gap-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 leading-snug">
                                            Source:{" "}
                                            <span className="text-zinc-700 dark:text-zinc-300 font-black">{alert.source}</span>
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 leading-snug">
                                            Trigger:{" "}
                                            <span className="font-mono text-zinc-900 dark:text-white">{alert.actual}</span>
                                            {" "}(Limit: {alert.threshold})
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            {alert.resolved ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    <CheckCircle className="h-3 w-3 shrink-0" /> Auto-Resolved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    <Activity className="h-3 w-3 shrink-0" /> Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RESET CONFIRMATION MODAL ─────────────────────────────────────── */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowResetConfirm(false)}
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mb-6 shrink-0">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3">
                            Reset to Defaults?
                        </h2>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                            This will discard all your custom threshold values and routing preferences, returning them to factory system defaults.
                        </p>
                        <div className="flex flex-col sm:flex-row w-full gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReset}
                                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95"
                            >
                                Yes, Reset
                            </button>
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