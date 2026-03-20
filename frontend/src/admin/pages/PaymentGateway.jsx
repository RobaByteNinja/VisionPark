import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    CreditCard, Smartphone, Building2, Wallet,
    Activity, RefreshCw, CheckCircle, XCircle,
    Eye, EyeOff, Save, Link, AlertTriangle, Play,
    ChevronDown, ChevronUp, Building, Settings, Key, Info, X,
    MapPin, Check
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

// ── LOCATION DATA (same structure as PlatformAnalytics & SessionManager) ──────
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

// All lots flat list for cycling
const ALL_LOTS_FLAT = [
    "Bole Premium Lot", "Piazza Central", "Meskel Square Hub",
    "Dire Dawa Central", "Adama Terminal", "Stadium Parking",
    "Lake Tana Parking", "Mekelle City Parking", "Jigjiga Market Parking",
    "Hawassa Park & Ride",
];

// ── PAYMENT DATA ──────────────────────────────────────────────────────────────
const PAYOUT_SCHEDULES = ["Daily", "Weekly (Fridays)", "Monthly (1st)"];

const PAYOUT_BANKS = [
    { group: "Primary Payment Gateways", items: ["Telebirr", "Commercial Bank of Ethiopia (CBE)", "Bank of Abyssinia", "Cooperative Bank of Oromia (COOP)"] },
    { group: "Other Supported Banks", items: ["Awash Bank", "Addis International Bank", "Hibret Bank", "Berhan Bank", "Nib International Bank", "Enat Bank", "Amhara Bank"] },
    { group: "Microfinance & Wallets", items: ["CBE Birr", "AwashBirr", "Amole", "Coopay-Ebirr", "HelloCash", "E-Birr", "M-PESA Ethiopia"] }
];

const WALLETS = ["Telebirr", "CBE Birr", "AwashBirr", "Amole", "Coopay-Ebirr", "HelloCash", "E-Birr", "M-PESA Ethiopia"];

const PROVIDERS = [
    { id: "telebirr", name: "Telebirr", icon: Smartphone, color: "#10b981", active: true, health: "Online", txnCount: 1245, volume: 45200, successRate: 99.2, ping: "2s ago" },
    { id: "cbe", name: "CBE Birr", icon: Building2, color: "#8b5cf6", active: true, health: "Online", txnCount: 890, volume: 32500, successRate: 98.5, ping: "5s ago" },
    { id: "coop", name: "COOP Bank", icon: Building2, color: "#3b82f6", active: true, health: "Degraded", txnCount: 450, volume: 15800, successRate: 94.2, ping: "12s ago" },
    { id: "boa", name: "Bank of Abyssinia", icon: Building2, color: "#f59e0b", active: false, health: "Inactive", txnCount: 0, volume: 0, successRate: 0, ping: "-" },
    { id: "wallet", name: "VisionPark Wallet", icon: Wallet, color: "#6366f1", active: true, health: "Online", txnCount: 312, volume: 8500, successRate: 99.9, ping: "1s ago" },
];

const CHART_DATA = [
    { date: "Mon", telebirr: 99.1, cbe: 98.2, coop: 97.5, boa: 0, wallet: 99.9 },
    { date: "Tue", telebirr: 99.3, cbe: 98.5, coop: 96.8, boa: 0, wallet: 99.9 },
    { date: "Wed", telebirr: 98.5, cbe: 97.9, coop: 94.2, boa: 0, wallet: 100 },
    { date: "Thu", telebirr: 99.2, cbe: 98.8, coop: 95.5, boa: 0, wallet: 99.8 },
    { date: "Fri", telebirr: 99.4, cbe: 99.0, coop: 96.1, boa: 0, wallet: 99.9 },
    { date: "Sat", telebirr: 99.5, cbe: 98.4, coop: 93.8, boa: 0, wallet: 100 },
    { date: "Sun", telebirr: 99.2, cbe: 98.5, coop: 94.2, boa: 0, wallet: 99.9 },
];

// Each failed transaction is tagged with a lot
const FAILED_TXNS = [
    { id: "TXN-9981A", provider: "COOP Bank", amount: 150, code: "ERR_TIMEOUT", message: "Gateway connection timeout", time: "10 mins ago", lot: "Bole Premium Lot" },
    { id: "TXN-9980B", provider: "CBE Birr", amount: 60, code: "ERR_INSUFFICIENT", message: "Insufficient user funds", time: "25 mins ago", lot: "Piazza Central" },
    { id: "TXN-9975C", provider: "Telebirr", amount: 120, code: "ERR_NETWORK", message: "Provider network unreachable", time: "1 hour ago", lot: "Dire Dawa Central" },
    { id: "TXN-9962D", provider: "COOP Bank", amount: 45, code: "ERR_TIMEOUT", message: "Gateway connection timeout", time: "2 hours ago", lot: "Adama Terminal" },
    { id: "TXN-9951E", provider: "Telebirr", amount: 300, code: "ERR_AUTH", message: "Invalid API signature", time: "3 hours ago", lot: "Lake Tana Parking" },
];

const allPaymentMethods = PAYOUT_BANKS.flatMap(g => g.items);
const INITIAL_WEBHOOKS = {};
allPaymentMethods.forEach(method => {
    const id = method.toLowerCase().replace(/[^a-z0-9]/g, "");
    INITIAL_WEBHOOKS[id] = {
        name: method,
        url: `https://api.visionpark.et/chapa/${id}/webhook`,
        secret: `chapa_sec_${id}_${Math.floor(Math.random() * 10000)}`,
        lastSuccess: "Never",
        status: null
    };
});

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1c1c1f] border border-[#3f3f46] p-4 rounded-xl shadow-xl z-50 min-w-[180px]">
            <p className="text-zinc-300 text-sm font-bold mb-3 border-b border-zinc-700 pb-2">{label}</p>
            {payload.map((entry, i) => entry.value > 0 && (
                <div key={i} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-medium text-zinc-300">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: entry.color }}>{entry.value}%</span>
                </div>
            ))}
        </div>
    );
};

// ── DROPDOWN TRIGGER (matches PlatformAnalytics style) ────────────────────────
const DropdownTrigger = ({ value, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}
        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md"}`}>
        <span className="truncate pr-2 text-left">{value}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
    </button>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PaymentGateway() {
    const { showToast } = useOutletContext();

    // ── Location filter state ──────────────────────────────────────────────
    const [region, setRegion] = useState("All Regions");
    const [city, setCity] = useState("All Cities");
    const [lot, setLot] = useState("All Lots");
    const [activeLocDrop, setActiveLocDrop] = useState(null); // "region"|"city"|"lot"|null

    // ── Payment state ──────────────────────────────────────────────────────
    const [providers, setProviders] = useState(PROVIDERS);
    const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);
    const [failedTxns, setFailedTxns] = useState(FAILED_TXNS);
    const [activeChartLines, setActiveChartLines] = useState(PROVIDERS.map(p => p.id));

    const [showSecrets, setShowSecrets] = useState({});
    const [showBank, setShowBank] = useState(false);

    const [settlement, setSettlement] = useState({
        schedule: "Daily", threshold: 5000,
        bankName: "Commercial Bank of Ethiopia (CBE)", accountNumber: ""
    });

    const [activeSettleDrop, setActiveSettleDrop] = useState(null); // 'schedule'|'bank'|null
    const [isSavingSettlement, setIsSavingSettlement] = useState(false);

    const [configModalProvider, setConfigModalProvider] = useState(null);
    const [providerConfigData, setProviderConfigData] = useState({ merchantId: "", apiKey: "", alertPhone: "" });
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [configPhoneError, setConfigPhoneError] = useState("");
    const [configCharsRemaining, setConfigCharsRemaining] = useState(null);
    const [configShowKey, setConfigShowKey] = useState(false);

    const [togglingProvider, setTogglingProvider] = useState(null);
    const [testingWebhook, setTestingWebhook] = useState(null);
    const [retryingTxn, setRetryingTxn] = useState(null);

    const [accountError, setAccountError] = useState("");
    const [charsRemaining, setCharsRemaining] = useState(null);

    // ── Location helpers ───────────────────────────────────────────────────
    const closeLocDrop = () => setActiveLocDrop(null);

    const handleRegionSelect = (sel) => {
        let nc = "All Cities", nl = "All Lots";
        if (sel !== "All Regions") {
            const cs = CITIES_BY_REGION[sel] || [];
            if (cs.length === 1) { nc = cs[0]; const ls = LOTS_BY_CITY[nc] || []; if (ls.length === 1) nl = ls[0]; }
        }
        setRegion(sel); setCity(nc); setLot(nl); closeLocDrop();
    };
    const handleCitySelect = (sel) => {
        let nl = "All Lots";
        if (sel !== "All Cities") { const ls = LOTS_BY_CITY[sel] || []; if (ls.length === 1) nl = ls[0]; }
        setCity(sel); setLot(nl); closeLocDrop();
    };

    const isLocationFiltered = region !== "All Regions" || city !== "All Cities" || lot !== "All Lots";
    const locationLabel = lot !== "All Lots" ? lot : city !== "All Cities" ? city : region !== "All Regions" ? region : null;

    // Match a lot to the active filter
    const lotMatchesFilter = (lotName) => {
        if (lot !== "All Lots" && lotName !== lot) return false;
        if (city !== "All Cities" && LOT_TO_CITY[lotName] !== city) return false;
        if (region !== "All Regions") {
            const r = CITY_TO_REGION[LOT_TO_CITY[lotName]];
            if (r !== region && LOT_TO_CITY[lotName] !== region) return false;
        }
        return true;
    };

    // ── Filtered failed transactions ───────────────────────────────────────
    const filteredTxns = useMemo(() =>
        isLocationFiltered ? failedTxns.filter(t => lotMatchesFilter(t.lot)) : failedTxns,
        [failedTxns, region, city, lot]);

    // Filtered provider stats (scale down proportionally when filtered)
    const locationMultiplier = useMemo(() => {
        if (lot !== "All Lots") return 0.1;
        if (city !== "All Cities") return 0.4;
        if (region !== "All Regions") return 0.3;
        return 1;
    }, [region, city, lot]);

    // ── Settlement validation ──────────────────────────────────────────────
    useEffect(() => {
        const val = settlement.accountNumber;
        if (!val) { setAccountError(""); setCharsRemaining(null); return; }
        const isWallet = WALLETS.includes(settlement.bankName);
        const isMpesa = settlement.bankName === "M-PESA Ethiopia";
        const isStdBank = !isWallet && !isMpesa;
        if (isMpesa) {
            if (!val.startsWith("07") && !val.startsWith("+2517")) { setAccountError("Must be a Safaricom number (07 or +2517)"); setCharsRemaining(null); }
            else { const exp = val.startsWith("+") ? 13 : 10; const rem = exp - val.length; rem > 0 ? (setAccountError(""), setCharsRemaining(`${rem} digit${rem > 1 ? "s" : ""} left`)) : rem < 0 ? (setAccountError(`Too long. Max ${exp} digits.`), setCharsRemaining(null)) : (setAccountError(""), setCharsRemaining(null)); }
        } else if (isWallet) {
            if (!val.startsWith("09") && !val.startsWith("+2519")) { setAccountError("Must be an Ethio Telecom number (09 or +2519)"); setCharsRemaining(null); }
            else { const exp = val.startsWith("+") ? 13 : 10; const rem = exp - val.length; rem > 0 ? (setAccountError(""), setCharsRemaining(`${rem} digit${rem > 1 ? "s" : ""} left`)) : rem < 0 ? (setAccountError(`Too long. Max ${exp} digits.`), setCharsRemaining(null)) : (setAccountError(""), setCharsRemaining(null)); }
        } else if (isStdBank) {
            const max = 13; const rem = max - val.length;
            rem > 0 ? (setAccountError(""), setCharsRemaining(`Max ${rem} digit${rem > 1 ? "s" : ""} left`)) : rem < 0 ? (setAccountError(`Too long. Max ${max} digits.`), setCharsRemaining(null)) : (setAccountError(""), setCharsRemaining(null));
        } else { setAccountError(""); setCharsRemaining(null); }
    }, [settlement.accountNumber, settlement.bankName]);

    const handleAccountChange = (e) => {
        const val = e.target.value;
        const isWallet = WALLETS.includes(settlement.bankName);
        if (isWallet || settlement.bankName === "M-PESA Ethiopia") {
            let c = val.replace(/[^\d+]/g, ""); if (c.indexOf("+") > 0) c = c.replace(/\+/g, "");
            const ml = c.startsWith("+") ? 13 : 10; if (c.length > ml) c = c.substring(0, ml);
            setSettlement({ ...settlement, accountNumber: c });
        } else {
            let c = val.replace(/\D/g, ""); if (c.length > 13) c = c.substring(0, 13);
            setSettlement({ ...settlement, accountNumber: c });
        }
    };

    // ── Config phone validation ────────────────────────────────────────────
    const handleConfigPhoneChange = (e) => {
        if (!configModalProvider) return;
        let c = e.target.value.replace(/[^\d+]/g, ""); if (c.indexOf("+") > 0) c = c.replace(/\+/g, "");
        const isMpesa = configModalProvider.name === "M-PESA Ethiopia";
        const isWallet = WALLETS.includes(configModalProvider.name) && !isMpesa;
        const ml = c.startsWith("+") ? 13 : 10; if (c.length > ml) c = c.substring(0, ml);
        setProviderConfigData({ ...providerConfigData, alertPhone: c });
        if (!c.length) { setConfigPhoneError(""); setConfigCharsRemaining(null); return; }
        const rem = ml - c.length;
        if (isMpesa) {
            if (!c.startsWith("07") && !c.startsWith("+2517")) { setConfigPhoneError("Use Safaricom (07 or +2517)"); setConfigCharsRemaining(null); }
            else { setConfigPhoneError(""); rem > 0 ? setConfigCharsRemaining(`${rem} digit${rem > 1 ? "s" : ""} left`) : setConfigCharsRemaining(null); }
        } else if (isWallet || configModalProvider.name === "Telebirr" || configModalProvider.name === "CBE Birr") {
            if (!c.startsWith("09") && !c.startsWith("+2519")) { setConfigPhoneError("Use Ethio Telecom (09 or +2519)"); setConfigCharsRemaining(null); }
            else { setConfigPhoneError(""); rem > 0 ? setConfigCharsRemaining(`${rem} digit${rem > 1 ? "s" : ""} left`) : setConfigCharsRemaining(null); }
        } else {
            if (!c.startsWith("09") && !c.startsWith("+2519") && !c.startsWith("011")) { setConfigPhoneError("Use valid ET phone number"); setConfigCharsRemaining(null); }
            else { setConfigPhoneError(""); rem > 0 ? setConfigCharsRemaining(`${rem} digit${rem > 1 ? "s" : ""} left`) : setConfigCharsRemaining(null); }
        }
    };

    // ── Action handlers ────────────────────────────────────────────────────
    const handleToggleProvider = (id, current) => {
        setTogglingProvider(id);
        setProviders(prev => prev.map(p => p.id === id ? { ...p, active: !current, health: !current ? "Online" : "Inactive" } : p));
        setTimeout(() => {
            setTogglingProvider(null);
            showToast(`${PROVIDERS.find(p => p.id === id).name} ${!current ? "activated" : "deactivated"} successfully.`, "success");
        }, 800);
    };

    const handleTestWebhook = (id) => {
        setTestingWebhook(id);
        setWebhooks(prev => ({ ...prev, [id]: { ...prev[id], status: null } }));
        setTimeout(() => {
            setTestingWebhook(null);
            const ok = Math.random() > 0.2;
            setWebhooks(prev => ({ ...prev, [id]: { ...prev[id], status: ok ? "success" : "error", lastSuccess: ok ? "Just now" : prev[id].lastSuccess } }));
            ok ? showToast("Webhook ping successful (200 OK).", "success") : showToast("Webhook ping failed (503 Gateway Timeout).", "error");
        }, 1200);
    };

    const handleRetryTxn = (txnId) => {
        setRetryingTxn(txnId);
        setTimeout(() => {
            setRetryingTxn(null);
            setFailedTxns(prev => prev.filter(t => t.id !== txnId));
            showToast(`Transaction ${txnId} successfully re-queued.`, "success");
        }, 1500);
    };

    const handleSaveSettlement = () => {
        if (accountError || charsRemaining || !settlement.accountNumber) { showToast("Please provide a valid account/phone number before saving.", "error"); return; }
        setIsSavingSettlement(true);
        setTimeout(() => { setIsSavingSettlement(false); showToast("Settlement configuration saved successfully.", "success"); }, 1000);
    };

    const handleSaveProviderConfig = () => {
        if (configPhoneError || configCharsRemaining || !providerConfigData.alertPhone) { showToast("Please fix the alert phone number format.", "error"); return; }
        setIsSavingConfig(true);
        setTimeout(() => { setIsSavingConfig(false); setConfigModalProvider(null); showToast(`${configModalProvider.name} configuration updated successfully.`, "success"); }, 1200);
    };

    const openConfigModal = (provider) => {
        setConfigModalProvider(provider);
        setProviderConfigData({ merchantId: `MERCH_${provider.id.toUpperCase()}_8912`, apiKey: `sk_live_${Math.random().toString(36).substr(2, 9)}`, alertPhone: "" });
        setConfigPhoneError(""); setConfigCharsRemaining(null); setConfigShowKey(false);
    };

    const adjustThreshold = (amt) => setSettlement(prev => ({ ...prev, threshold: Math.max(0, prev.threshold + amt) }));
    const toggleChartLine = (id) => setActiveChartLines(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

    const getSuccessRateColor = (r) => r === 0 ? "text-zinc-500" : r >= 98 ? "text-emerald-500" : r >= 95 ? "text-amber-500" : "text-red-500";
    const getHealthDot = (h) => h === "Online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : h === "Degraded" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" : "bg-zinc-400";

    const isWalletSelected = WALLETS.includes(settlement.bankName);
    const isMpesaSelected = settlement.bankName === "M-PESA Ethiopia";

    // Dropdown list item shared between both location and settlement dropdowns
    const DItem = ({ label, active, onClick }) => (
        <button onClick={onClick}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors outline-none text-left
                ${active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
            <span className="truncate pr-4">{label}</span>
            {active && <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />}
        </button>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500" />
                        Payment Gateway
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage payment provider integrations and monitor transaction health.</p>
                </div>
            </div>

            {/* 2. LOCATION FILTER CARD */}
            <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Filter by Location</span>
                    {isLocationFiltered && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-full truncate max-w-[160px]">
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
                    <DropdownTrigger value={region} onClick={() => setActiveLocDrop("region")} />
                    <DropdownTrigger value={city} disabled={region === "All Regions"} onClick={() => setActiveLocDrop("city")} />
                    <DropdownTrigger value={lot} disabled={city === "All Cities"} onClick={() => setActiveLocDrop("lot")} />
                </div>
                {isLocationFiltered && (
                    <p className="text-[10px] font-bold text-zinc-500 mt-3 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                        Showing data for <span className="text-zinc-900 dark:text-white ml-0.5">{locationLabel}</span> — stats scaled proportionally to lot share.
                    </p>
                )}
            </div>

            {/* 3. GATEWAY STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 shrink-0">
                {providers.map(provider => {
                    const Icon = provider.icon;
                    const isToggling = togglingProvider === provider.id;
                    const scaledTxn = Math.round(provider.txnCount * locationMultiplier);
                    const scaledVol = Math.round(provider.volume * locationMultiplier);

                    return (
                        <div key={provider.id} className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col relative transition-all group hover:border-indigo-500/30">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-white/5" style={{ color: provider.color }}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{provider.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`h-1.5 w-1.5 rounded-full ${getHealthDot(provider.health)}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{provider.health}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleToggleProvider(provider.id, provider.active)} disabled={isToggling}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-200 disabled:opacity-50 ${provider.active ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                                    <span className="sr-only">Toggle {provider.name}</span>
                                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ${provider.active ? "translate-x-2" : "-translate-x-2"}`} />
                                </button>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 mb-5 flex-1 ${!provider.active && "opacity-40 grayscale transition-all"}`}>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                                        {isLocationFiltered ? "Lot Vol" : "Today's Vol"}
                                    </p>
                                    <p className="text-lg font-black text-zinc-900 dark:text-white">{scaledTxn.toLocaleString()}</p>
                                    <p className="text-xs font-medium text-zinc-500">{scaledVol.toLocaleString()} ETB</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Success Rate</p>
                                    <p className={`text-lg font-black ${getSuccessRateColor(provider.successRate)}`}>
                                        {provider.active ? `${provider.successRate}%` : "-"}
                                    </p>
                                    <p className="text-[10px] font-medium text-zinc-500 mt-1 flex items-center gap-1"><Activity className="h-3 w-3" /> {provider.ping}</p>
                                </div>
                            </div>

                            <button onClick={() => openConfigModal(provider)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all outline-none active:scale-95 flex justify-center items-center gap-2 ${provider.active ? "border-2 border-indigo-200 hover:border-indigo-600 text-indigo-700 dark:border-indigo-500/30 dark:hover:border-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-600 cursor-not-allowed"}`}>
                                <Settings className="h-3.5 w-3.5" /> Configure
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* 4. CHART & WEBHOOKS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 relative z-10">

                {/* Transaction Health Chart */}
                <div className="xl:col-span-2 bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" /> Transaction Health
                            </h2>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                Success Rate % (Last 7 Days){isLocationFiltered && ` · ${locationLabel}`}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PROVIDERS.filter(p => p.active).map(provider => (
                                <button key={`legend-${provider.id}`} onClick={() => toggleChartLine(provider.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all outline-none active:scale-95 ${activeChartLines.includes(provider.id) ? "bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border-transparent" : "bg-transparent text-zinc-400 border-zinc-200 dark:border-white/10 opacity-50 grayscale"}`}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: provider.color }} />
                                    {provider.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} opacity={0.2} />
                                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} dx={-10} domain={[90, 100]} tickFormatter={v => `${v}%`} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: "#52525b", strokeWidth: 1, strokeDasharray: "4 4" }} />
                                {PROVIDERS.map(provider => activeChartLines.includes(provider.id) && provider.active && (
                                    <Line key={`line-${provider.id}`} type="monotone" dataKey={provider.id} name={provider.name} stroke={provider.color} strokeWidth={3} dot={{ r: 4, fill: provider.color, stroke: "#121214", strokeWidth: 2 }} activeDot={{ r: 6, fill: provider.color, stroke: "#121214", strokeWidth: 2 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Webhook Configuration */}
                <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col overflow-hidden max-h-[400px] xl:max-h-[500px]">
                    <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Link className="h-5 w-5 text-indigo-500" /> Webhook Config
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">API Endpoint Routing (For Admin)</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        {Object.keys(webhooks).map(key => {
                            const hook = webhooks[key];
                            const isTesting = testingWebhook === key;
                            return (
                                <div key={key} className="space-y-3 pb-6 border-b border-zinc-100 dark:border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-md flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 shrink-0">
                                                <Building className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{hook.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {hook.status === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                            {hook.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                                            <button onClick={() => handleTestWebhook(key)} disabled={isTesting}
                                                className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 outline-none disabled:opacity-50">
                                                {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                                {isTesting ? "Pinging..." : "Test"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <input type="url" value={hook.url} onChange={e => setWebhooks({ ...webhooks, [key]: { ...hook, url: e.target.value } })}
                                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                                        <div className="relative">
                                            <input type={showSecrets[key] ? "text" : "password"} value={hook.secret} onChange={e => setWebhooks({ ...webhooks, [key]: { ...hook, secret: e.target.value } })}
                                                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                                            <button onClick={() => setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 outline-none">
                                                {showSecrets[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Last Success: {hook.lastSuccess}</p>
                                            <button className="text-[10px] font-bold text-zinc-500 hover:text-indigo-500 outline-none flex items-center gap-1"><Save className="h-3 w-3" /> Save</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 5. FAILED TRANSACTIONS + SETTLEMENT */}
            <div className="flex flex-col xl:flex-row gap-6 shrink-0 relative z-10">

                {/* Failed Transactions */}
                <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Failed Transactions
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                {isLocationFiltered
                                    ? `${filteredTxns.length} failure${filteredTxns.length !== 1 ? "s" : ""} at ${locationLabel}`
                                    : "Requires manual review or retry"}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[720px]">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-black/20">
                                    <th className="px-5 py-4 font-black">TXN ID</th>
                                    <th className="px-5 py-4 font-black">Provider</th>
                                    <th className="px-5 py-4 font-black">Amount</th>
                                    <th className="px-5 py-4 font-black">Lot</th>
                                    <th className="px-5 py-4 font-black">Error Details</th>
                                    <th className="px-5 py-4 font-black">Time</th>
                                    <th className="px-5 py-4 font-black text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredTxns.length > 0 ? filteredTxns.map(txn => {
                                    const isRetrying = retryingTxn === txn.id;
                                    const provider = PROVIDERS.find(p => p.name === txn.provider);
                                    return (
                                        <tr key={txn.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-4 font-mono font-bold text-zinc-600 dark:text-zinc-300 text-xs whitespace-nowrap">{txn.id}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center shrink-0" style={{ color: provider?.color }}>
                                                        {provider ? <provider.icon className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                                                    </div>
                                                    <span className="font-bold text-zinc-900 dark:text-white text-xs">{txn.provider}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-black text-zinc-900 dark:text-white whitespace-nowrap">{txn.amount} ETB</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                    <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                                                    <span className="truncate max-w-[110px]">{txn.lot}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-mono text-[10px] text-red-500 font-bold">{txn.code}</p>
                                                <p className="text-xs text-zinc-500 truncate max-w-[180px]">{txn.message}</p>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-zinc-500 whitespace-nowrap">{txn.time}</td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <button onClick={() => handleRetryTxn(txn.id)} disabled={isRetrying}
                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-indigo-50 text-zinc-700 hover:text-indigo-600 dark:bg-white/10 dark:hover:bg-indigo-500/20 dark:text-zinc-300 dark:hover:text-indigo-400 transition-colors outline-none disabled:opacity-50 flex items-center gap-1.5 ml-auto">
                                                    {isRetrying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                                    {isRetrying ? "Queuing..." : "Retry"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-zinc-500">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-3 text-emerald-500 opacity-50" />
                                            <p className="text-sm font-bold text-zinc-400">
                                                {isLocationFiltered ? `No failed transactions at ${locationLabel}.` : "No failed transactions."}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Settlement Settings */}
                <div className="w-full xl:w-80 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col shrink-0">
                    <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-indigo-500" /> Settlement
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Payout Configuration (Owner)</p>
                    </div>

                    <div className="p-6 space-y-5 flex-1">

                        {/* Payout Schedule dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payout Schedule</label>
                            <button type="button" onClick={() => setActiveSettleDrop(activeSettleDrop === "schedule" ? null : "schedule")}
                                className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border rounded-xl px-4 py-3 text-sm font-bold outline-none transition-colors cursor-pointer ${activeSettleDrop === "schedule" ? "border-indigo-500 text-indigo-700 dark:text-indigo-400" : "border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-indigo-500"}`}>
                                <span className="truncate">{settlement.schedule}</span>
                                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${activeSettleDrop === "schedule" ? "rotate-180 text-indigo-500" : "text-zinc-400"}`} />
                            </button>
                            {activeSettleDrop === "schedule" && (
                                <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setActiveSettleDrop(null)} />
                                    <div className="absolute right-0 left-0 top-full mt-2 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                                        <div className="p-1.5 flex flex-col custom-scrollbar">
                                            {PAYOUT_SCHEDULES.map(opt => (
                                                <button key={opt} onClick={() => { setSettlement({ ...settlement, schedule: opt }); setActiveSettleDrop(null); }}
                                                    className={`px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors outline-none flex justify-between ${settlement.schedule === opt ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                                    {opt} {settlement.schedule === opt && <CheckCircle className="h-4 w-4 text-indigo-500" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                                            <button onClick={() => setActiveSettleDrop(null)} className="w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors outline-none active:scale-95">Cancel</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Threshold */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Minimum Threshold (ETB)</label>
                            <div className="flex bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                                <input type="number" value={settlement.threshold}
                                    onChange={e => setSettlement({ ...settlement, threshold: e.target.value === "" ? "" : parseInt(e.target.value) })}
                                    className="w-full bg-transparent px-4 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <div className="flex flex-col border-l border-zinc-200 dark:border-white/10 shrink-0 w-10">
                                    <button type="button" onClick={() => adjustThreshold(500)} className="flex-1 flex items-center justify-center text-zinc-500 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/5 border-b border-zinc-200 dark:border-white/10 outline-none transition-colors"><ChevronUp className="h-3 w-3" /></button>
                                    <button type="button" onClick={() => adjustThreshold(-500)} className="flex-1 flex items-center justify-center text-zinc-500 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/5 outline-none transition-colors"><ChevronDown className="h-3 w-3" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Payout Bank dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payout Destination Bank</label>
                            <button type="button" onClick={() => setActiveSettleDrop(activeSettleDrop === "bank" ? null : "bank")}
                                className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-black/40 border rounded-xl px-4 py-3 text-sm font-bold outline-none transition-colors cursor-pointer ${activeSettleDrop === "bank" ? "border-indigo-500 text-indigo-700 dark:text-indigo-400" : "border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-indigo-500"}`}>
                                <span className="truncate pr-2">{settlement.bankName}</span>
                                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${activeSettleDrop === "bank" ? "rotate-180 text-indigo-500" : "text-zinc-400"}`} />
                            </button>
                            {activeSettleDrop === "bank" && (
                                <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setActiveSettleDrop(null)} />
                                    <div className="absolute right-0 left-0 top-full mt-2 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                                        <div className="p-1.5 flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {PAYOUT_BANKS.map((group, idx) => (
                                                <div key={idx} className="mb-3 last:mb-0">
                                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-white/5 rounded-md mb-1">{group.group}</div>
                                                    <div className="flex flex-col">
                                                        {group.items.map(opt => (
                                                            <button key={opt} onClick={() => { setSettlement({ ...settlement, bankName: opt, accountNumber: "" }); setActiveSettleDrop(null); }}
                                                                className={`flex w-full px-3 py-2.5 rounded-lg text-sm font-medium justify-between outline-none transition-colors text-left ${settlement.bankName === opt ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                                                <span className="truncate pr-4">{opt}</span>
                                                                {settlement.bankName === opt && <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                                            <button onClick={() => setActiveSettleDrop(null)} className="w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors outline-none active:scale-95">Cancel</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Account/Phone number */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    {isMpesaSelected ? "Safaricom Phone Number" : isWalletSelected ? "Phone Number (Ethio Telecom)" : "Account Number"}
                                </label>
                                {charsRemaining && !accountError && (
                                    <span className="text-[10px] font-bold text-zinc-400 animate-in fade-in">{charsRemaining}</span>
                                )}
                            </div>
                            <div className="relative">
                                <input type={showBank ? "text" : "password"} value={settlement.accountNumber} onChange={handleAccountChange}
                                    placeholder={isWalletSelected && !isMpesaSelected ? "+2519... (Ethio Telecom)" : isMpesaSelected ? "+2517... (Safaricom)" : "1000..."}
                                    className={`w-full bg-zinc-50 dark:bg-black/40 border rounded-xl pl-4 pr-10 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none transition-colors ${accountError ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/10 focus:border-indigo-500"}`} />
                                <button onClick={() => setShowBank(!showBank)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 outline-none">
                                    {showBank ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {accountError && <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 mt-1.5">{accountError}</p>}
                        </div>
                    </div>

                    <div className="p-6 pt-0 shrink-0">
                        <button onClick={handleSaveSettlement} disabled={isSavingSettlement}
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                            {isSavingSettlement ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSavingSettlement ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── PROVIDER CONFIG MODAL ── */}
            {configModalProvider && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfigModalProvider(null)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-zinc-200 dark:border-white/10">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50 dark:bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white dark:bg-white/5 shadow-sm border border-zinc-200 dark:border-white/10" style={{ color: configModalProvider.color }}>
                                    <configModalProvider.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">{configModalProvider.name} Config</h2>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Production Integration</p>
                                </div>
                            </div>
                            <button onClick={() => setConfigModalProvider(null)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors outline-none"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                    <strong>Admin Instructions:</strong> Update production API keys and merchant identifiers for {configModalProvider.name}. These credentials route driver payments directly to the designated settlement account. Changes take effect immediately across all nodes.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Merchant ID</label>
                                    <input type="text" value={providerConfigData.merchantId} onChange={e => setProviderConfigData({ ...providerConfigData, merchantId: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Production API Key / Secret</label>
                                    <div className="relative">
                                        <input type={configShowKey ? "text" : "password"} value={providerConfigData.apiKey} onChange={e => setProviderConfigData({ ...providerConfigData, apiKey: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                                        <button onClick={() => setConfigShowKey(!configShowKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 outline-none">
                                            {configShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Technical Alert Phone Number</label>
                                        {configCharsRemaining && !configPhoneError && <span className="text-[10px] font-bold text-zinc-400 animate-in fade-in">{configCharsRemaining}</span>}
                                    </div>
                                    <input type="tel" value={providerConfigData.alertPhone} onChange={handleConfigPhoneChange}
                                        placeholder={configModalProvider.name === "M-PESA Ethiopia" ? "+2517... (Safaricom required)" : WALLETS.includes(configModalProvider.name) || configModalProvider.name === "Telebirr" || configModalProvider.name === "CBE Birr" ? "+2519... (Ethio Telecom required)" : "+2519... (Valid ET Phone)"}
                                        className={`w-full bg-zinc-50 dark:bg-black/40 border rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none transition-colors ${configPhoneError ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/10 focus:border-indigo-500"}`} />
                                    {configPhoneError && <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 mt-1">{configPhoneError}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 shrink-0 flex gap-3">
                            <button onClick={() => setConfigModalProvider(null)} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors outline-none active:scale-95">Cancel</button>
                            <button onClick={handleSaveProviderConfig} disabled={isSavingConfig || !!configPhoneError}
                                className="flex-[1.5] py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale">
                                {isSavingConfig ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSavingConfig ? "Saving..." : "Save Configuration"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LOCATION DROPDOWN MODAL ── */}
            {activeLocDrop && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeLocDrop} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50 dark:bg-[#121214]">
                            <h2 className="text-base font-black text-zinc-900 dark:text-white">
                                Select {activeLocDrop === "region" ? "Region" : activeLocDrop === "city" ? "City" : "Lot"}
                            </h2>
                            <button onClick={closeLocDrop} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-3 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
                            {activeLocDrop === "region" && REGION_GROUPS.map(g => (
                                <div key={g.group} className="mb-3">
                                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-500">{g.group}</div>
                                    <div className="flex flex-col gap-1">
                                        {g.options.map(o => (
                                            <button key={o} onClick={() => handleRegionSelect(o)}
                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${region === o ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                                {o} {region === o && <Check className="h-4 w-4 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {activeLocDrop === "city" && (
                                <div className="flex flex-col gap-1 mt-1">
                                    {["All Cities", ...(CITIES_BY_REGION[region]?.filter(c => c !== "All Cities") || [])].map(o => (
                                        <button key={o} onClick={() => handleCitySelect(o)}
                                            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${city === o ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                            {o} {city === o && <Check className="h-4 w-4 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {activeLocDrop === "lot" && (
                                <div className="flex flex-col gap-1 mt-1">
                                    {["All Lots", ...(LOTS_BY_CITY[city] || []).filter(l => l !== "All Lots")].map(o => (
                                        <button key={o} onClick={() => { setLot(o); closeLocDrop(); }}
                                            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer ${lot === o ? "bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm" : "border border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                                            {o} {lot === o && <Check className="h-4 w-4 shrink-0" />}
                                        </button>
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