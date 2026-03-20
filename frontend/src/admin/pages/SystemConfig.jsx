import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Settings, Globe, Cpu, Database, Activity,
    Save, RefreshCw, CheckCircle, AlertTriangle,
    Eye, EyeOff, ChevronDown, ChevronUp, XCircle, Server, Link
} from "lucide-react";

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
    systemName: "VisionPark",
    environment: "Staging", // Development, Staging, Production
    language: "English",
    timezone: "Africa/Addis_Ababa",
    maintenanceMode: false,

    yoloModel: "YOLOv8s",
    confThreshold: 70,
    fpsRate: 2,
    gpuAccel: true,
    autoUpdateModel: true,

    fbProjectId: "visionpark-et-prod",
    fbPoolSize: 10,
    fbDbUrl: "https://visionpark-et-prod-default-rtdb.firebaseio.com",

    apiRateLimit: 1000,
    apiTimeout: 30,
    corsOrigins: "https://admin.visionpark.et\nhttps://driver.visionpark.et\nhttp://localhost:5173",
    webhookRetries: 3,
    logLevel: "INFO"
};

const HEALTH_SERVICES = [
    { id: "firebase", name: "Firebase Realtime DB" },
    { id: "fastapi", name: "FastAPI Backend" },
    { id: "yolo", name: "YOLOv8 Engine" },
    { id: "payment", name: "Payment Gateway (Chapa)" },
    { id: "email", name: "Email Service (SMTP)" },
    { id: "sms", name: "SMS Gateway (EthioTel)" },
];

// Async delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function SystemConfig() {
    // 🛡️ Safe Context Extraction
    const context = useOutletContext() || {};
    const showToast = context.showToast || ((msg, type) => alert(`[${type.toUpperCase()}] ${msg}`));

    // --- STATES ---
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [savedConfig, setSavedConfig] = useState(DEFAULT_CONFIG);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState("Never");

    // UI Modals & Reveals
    const [showProdWarning, setShowProdWarning] = useState(false);
    const [pendingEnv, setPendingEnv] = useState(null);
    const [showFbProject, setShowFbProject] = useState(false);
    const [showFbUrl, setShowFbUrl] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Testing States
    const [isTestingDb, setIsTestingDb] = useState(false);
    const [dbTestStatus, setDbTestStatus] = useState("idle"); // idle, success, error

    // Health Check States
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [lastHealthCheck, setLastHealthCheck] = useState("Never");
    const [healthStatus, setHealthStatus] = useState(
        HEALTH_SERVICES.reduce((acc, curr) => ({ ...acc, [curr.id]: "idle" }), {})
    );

    // --- COMPUTED ---
    const unsavedChangesCount = Object.keys(config).filter(key => config[key] !== savedConfig[key]).length;
    const isDangerZone = config.environment === "Production" || config.maintenanceMode;

    // --- HANDLERS ---
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleEnvClick = (env) => {
        if (env === "Production" && config.environment !== "Production") {
            setPendingEnv("Production");
            setShowProdWarning(true);
        } else {
            handleChange("environment", env);
        }
    };

    const confirmProductionEnv = () => {
        handleChange("environment", "Production");
        setShowProdWarning(false);
        setPendingEnv(null);
    };

    const handleSave = async () => {
        if (unsavedChangesCount === 0) return;
        setIsSaving(true);
        await delay(1200); // Simulate network save
        setSavedConfig(config);
        setIsSaving(false);

        const now = new Date();
        setLastSaved(now.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        showToast("System configuration saved successfully.", "success");
    };

    const handleTestDb = async () => {
        setIsTestingDb(true);
        setDbTestStatus("idle");
        await delay(1500);

        // 95% success rate simulation
        if (Math.random() > 0.05) {
            setDbTestStatus("success");
            showToast("Database connection established successfully.", "success");
        } else {
            setDbTestStatus("error");
            showToast("Connection failed. Check Project ID and URL.", "error");
        }
        setIsTestingDb(false);
    };

    const runHealthCheck = async () => {
        setIsCheckingHealth(true);
        // Reset all to checking
        const newStatus = {};
        HEALTH_SERVICES.forEach(s => newStatus[s.id] = "checking");
        setHealthStatus(newStatus);

        for (let service of HEALTH_SERVICES) {
            await delay(600); // Wait 600ms per service to simulate ping
            setHealthStatus(prev => ({
                ...prev,
                [service.id]: Math.random() > 0.05 ? "online" : "error" // 5% chance of failure for realism
            }));
        }

        setLastHealthCheck(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setIsCheckingHealth(false);
    };

    // --- REUSABLE CUSTOM UI COMPONENTS ---
    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
        >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    const CustomDropdown = ({ id, value, options, onChange }) => {
        const isOpen = activeDropdown === id;
        return (
            <div className="relative w-full">
                <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : id)}
                    className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-colors cursor-pointer h-[42px] ${isOpen ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-indigo-500'}`}
                >
                    <span className="truncate pr-2">{value}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-indigo-500' : 'text-zinc-400'}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[250px]">
                            <div className="p-1.5 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                                {options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { onChange(opt); setActiveDropdown(null); }}
                                        className={`px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors outline-none flex justify-between items-center shrink-0 ${value === opt ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {value === opt && <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 ml-2" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const CustomNumberInput = ({ value, onChange, min, max, step = 1 }) => {
        const handleUp = () => {
            const current = Number(value || 0);
            if (max !== undefined && current + step > max) return;
            onChange(current + step);
        };
        const handleDown = () => {
            const current = Number(value || 0);
            if (min !== undefined && current - step < min) return;
            onChange(current - step);
        };

        return (
            <div className="flex bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors h-[42px]">
                <input
                    type="number"
                    value={value}
                    min={min} max={max} step={step}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (val !== "") val = Number(val);
                        onChange(val);
                    }}
                    className="w-full bg-transparent px-4 py-2 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l border-zinc-200 dark:border-white/10 shrink-0 w-10 bg-zinc-100/50 dark:bg-white/5">
                    <button
                        type="button"
                        onClick={handleUp}
                        className="flex-1 flex items-center justify-center text-zinc-500 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-white/10 border-b border-zinc-200 dark:border-white/10 outline-none transition-colors"
                    >
                        <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={handleDown}
                        className="flex-1 flex items-center justify-center text-zinc-500 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-white/10 outline-none transition-colors"
                    >
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10">

            {/* --- MAINTENANCE BANNER --- */}
            {config.maintenanceMode && (
                <div className="w-full bg-red-600 text-white p-3 rounded-2xl shadow-lg flex items-center justify-center gap-3 animate-in slide-in-from-top-4 shrink-0">
                    <AlertTriangle className="h-5 w-5 animate-pulse shrink-0" />
                    <span className="text-sm font-black uppercase tracking-widest whitespace-normal break-words text-center">Maintenance Mode Active — System is Offline for Users</span>
                </div>
            )}

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3 whitespace-normal break-words">
                            <Settings className={`h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500 shrink-0 ${isSaving ? 'animate-spin' : ''}`} />
                            System Config
                        </h1>
                        {unsavedChangesCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span> {unsavedChangesCount} Unsaved
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-normal break-words">Global system settings and environment configuration.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center sm:text-right hidden md:block mr-2">
                        Last Saved: <br /> <span className="text-zinc-600 dark:text-zinc-300">{lastSaved}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || unsavedChangesCount === 0}
                        className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale whitespace-nowrap"
                    >
                        {isSaving ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                        {isSaving ? "Saving..." : "Save Configuration"}
                    </button>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-6">

                    {/* 2. GENERAL SETTINGS CARD */}
                    <div className={`bg-white dark:bg-[#121214] rounded-3xl shadow-sm border transition-colors ${isDangerZone ? 'border-red-200 dark:border-red-500/30' : 'border-zinc-200 dark:border-white/5'} ${['language_select', 'timezone_select'].includes(activeDropdown) ? 'z-50 relative' : 'z-10 relative'}`}>
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-t-[23px] flex items-center justify-between">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 whitespace-normal break-words">
                                <Globe className="h-5 w-5 text-indigo-500 shrink-0" /> General Settings
                            </h2>
                            <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-mono font-black uppercase tracking-widest shrink-0">v2.4.1</span>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">System Name</label>
                                <input
                                    type="text"
                                    value={config.systemName}
                                    onChange={(e) => handleChange('systemName', e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors h-[42px]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Environment</label>
                                <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100 dark:bg-white/5 rounded-xl">
                                    {["Development", "Staging", "Production"].map(env => (
                                        <button
                                            key={env}
                                            onClick={() => handleEnvClick(env)}
                                            className={`flex-1 min-w-[100px] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all outline-none ${config.environment === env ? (env === 'Production' ? 'bg-red-500 text-white shadow-md' : 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-white/10') : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                        >
                                            {env}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Default Language</label>
                                    <CustomDropdown
                                        id="language_select"
                                        value={config.language}
                                        onChange={(val) => handleChange('language', val)}
                                        options={["English", "Amharic"]}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Base Currency</label>
                                    <input
                                        type="text"
                                        value="ETB (Ethiopian Birr)"
                                        readOnly
                                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-500 cursor-not-allowed h-[42px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">System Timezone</label>
                                <CustomDropdown
                                    id="timezone_select"
                                    value={config.timezone}
                                    onChange={(val) => handleChange('timezone', val)}
                                    options={["Africa/Addis_Ababa", "UTC", "GMT"]}
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-4">
                                <div className="flex flex-col min-w-0 pr-4">
                                    <span className={`text-sm font-black uppercase tracking-widest whitespace-normal break-words leading-tight ${config.maintenanceMode ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>Maintenance Mode</span>
                                    <span className="text-[10px] font-medium text-zinc-500 mt-1 whitespace-normal break-words leading-tight">Disables driver access. Admins only.</span>
                                </div>
                                <Toggle checked={config.maintenanceMode} onChange={(val) => handleChange('maintenanceMode', val)} />
                            </div>
                        </div>
                    </div>

                    {/* 4. FIREBASE / DATABASE SETTINGS CARD */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 relative z-10">
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-t-[23px]">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 whitespace-normal break-words">
                                <Database className="h-5 w-5 text-indigo-500 shrink-0" /> Database & Cloud
                            </h2>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Firebase Project ID</label>
                                <div className="relative">
                                    <input
                                        type={showFbProject ? "text" : "password"}
                                        value={config.fbProjectId}
                                        onChange={(e) => handleChange('fbProjectId', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors h-[42px]"
                                    />
                                    <button onClick={() => setShowFbProject(!showFbProject)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 outline-none">
                                        {showFbProject ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Realtime DB URL</label>
                                <div className="relative">
                                    <input
                                        type={showFbUrl ? "text" : "password"}
                                        value={config.fbDbUrl}
                                        onChange={(e) => handleChange('fbDbUrl', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors h-[42px]"
                                    />
                                    <button onClick={() => setShowFbUrl(!showFbUrl)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 outline-none">
                                        {showFbUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cloud Region</label>
                                    <input
                                        type="text" value="us-central1" readOnly
                                        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-zinc-500 cursor-not-allowed h-[42px]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Connection Pool</label>
                                    <CustomNumberInput
                                        value={config.fbPoolSize}
                                        onChange={(val) => handleChange('fbPoolSize', val)}
                                        min={1} max={100}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    {dbTestStatus === "success" && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                                    {dbTestStatus === "error" && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                    <span className={`text-xs font-bold uppercase tracking-widest whitespace-normal break-words ${dbTestStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : dbTestStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}>
                                        {dbTestStatus === 'idle' ? 'Status: Unknown' : dbTestStatus === 'success' ? 'Connection OK' : 'Connection Failed'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleTestDb}
                                    disabled={isTestingDb}
                                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isTestingDb ? <RefreshCw className="h-3 w-3 animate-spin shrink-0" /> : <Activity className="h-3 w-3 shrink-0" />}
                                    {isTestingDb ? "Pinging..." : "Test Connection"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-6">

                    {/* 3. AI ENGINE SETTINGS CARD */}
                    <div className={`bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 transition-all ${['yolo_model'].includes(activeDropdown) ? 'z-50 relative' : 'z-10 relative'}`}>
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-t-[23px]">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 whitespace-normal break-words">
                                <Cpu className="h-5 w-5 text-indigo-500 shrink-0" /> AI Engine Core
                            </h2>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active YOLOv8 Model</label>
                                    <CustomDropdown
                                        id="yolo_model"
                                        value={config.yoloModel}
                                        onChange={(val) => handleChange('yoloModel', val)}
                                        options={["YOLOv8n (Nano)", "YOLOv8s (Small)", "YOLOv8m (Medium)"]}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Frame Processing (FPS)</label>
                                    <CustomNumberInput
                                        value={config.fpsRate}
                                        onChange={(val) => handleChange('fpsRate', val)}
                                        min={1} max={60}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 whitespace-normal break-words pr-2">Inference Confidence Threshold</label>
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 shrink-0">{config.confThreshold}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={config.confThreshold}
                                    onChange={(e) => handleChange('confThreshold', Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-sm font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-tight">Enable GPU Acceleration</span>
                                        <span className="text-[10px] font-medium text-zinc-500 mt-1 whitespace-normal break-words leading-tight">Requires CUDA/TensorRT hardware.</span>
                                    </div>
                                    <Toggle checked={config.gpuAccel} onChange={(val) => handleChange('gpuAccel', val)} />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-sm font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-tight">Auto-update Neural Weights</span>
                                        <span className="text-[10px] font-medium text-zinc-500 mt-1 whitespace-normal break-words leading-tight">Download latest models nightly.</span>
                                    </div>
                                    <Toggle checked={config.autoUpdateModel} onChange={(val) => handleChange('autoUpdateModel', val)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. API & INTEGRATION SETTINGS CARD */}
                    <div className={`bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 transition-all ${['log_level'].includes(activeDropdown) ? 'z-50 relative' : 'z-10 relative'}`}>
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-t-[23px]">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 whitespace-normal break-words">
                                <Server className="h-5 w-5 text-indigo-500 shrink-0" /> API & Integration
                            </h2>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Rate Limit (req/min)</label>
                                    <CustomNumberInput
                                        value={config.apiRateLimit}
                                        onChange={(val) => handleChange('apiRateLimit', val)}
                                        min={100} step={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">API Timeout (sec)</label>
                                    <CustomNumberInput
                                        value={config.apiTimeout}
                                        onChange={(val) => handleChange('apiTimeout', val)}
                                        min={5} max={120} step={5}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CORS Allowed Origins</label>
                                <textarea
                                    value={config.corsOrigins}
                                    onChange={(e) => handleChange('corsOrigins', e.target.value)}
                                    rows={3}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono font-medium text-zinc-900 dark:text-white outline-none focus:border-indigo-500 custom-scrollbar resize-none transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Webhook Retries</label>
                                    <CustomNumberInput
                                        value={config.webhookRetries}
                                        onChange={(val) => handleChange('webhookRetries', val)}
                                        min={0} max={10}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">System Log Level</label>
                                    <CustomDropdown
                                        id="log_level"
                                        value={config.logLevel}
                                        onChange={(val) => handleChange('logLevel', val)}
                                        options={["ERROR", "WARN", "INFO", "DEBUG"]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* 6. SYSTEM HEALTH CHECK (BOTTOM) */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 shrink-0 mt-2 relative z-10">
                <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] rounded-t-[23px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 whitespace-normal break-words">
                            <Activity className="h-5 w-5 text-indigo-500 shrink-0" /> System Diagnostics
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 whitespace-normal break-words">Live Service Verification</p>
                    </div>
                    <button
                        onClick={runHealthCheck}
                        disabled={isCheckingHealth}
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                        <RefreshCw className={`h-4 w-4 shrink-0 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                        {isCheckingHealth ? "Pinging..." : "Run Health Check"}
                    </button>
                </div>

                <div className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {HEALTH_SERVICES.map(service => {
                            const status = healthStatus[service.id];
                            return (
                                <div key={service.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/5">
                                    <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-normal break-words pr-2 leading-tight">{service.name}</span>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className={`h-3 w-3 rounded-full ${status === 'idle' ? 'bg-zinc-300 dark:bg-zinc-600' :
                                                status === 'checking' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                                                    status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                                                        'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                            }`}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4 text-right">
                        Last Check: {lastHealthCheck}
                    </p>
                </div>
            </div>

            {/* --- PRODUCTION WARNING MODAL --- */}
            {showProdWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProdWarning(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-red-200 dark:border-red-500/30 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mb-6 shadow-inner shrink-0">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3 whitespace-normal break-words">Switch to Production?</h2>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed whitespace-normal break-words">
                            You are changing the active environment to <strong className="text-zinc-900 dark:text-white">Production</strong>. This will route real telemetry data and payment requests to live gateways. This directly affects live users.
                        </p>
                        <div className="flex flex-col sm:flex-row w-full gap-3">
                            <button onClick={() => setShowProdWarning(false)} className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95 whitespace-nowrap">
                                Cancel
                            </button>
                            <button onClick={confirmProductionEnv} className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95 whitespace-nowrap">
                                Enter Production
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