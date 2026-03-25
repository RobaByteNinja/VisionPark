// IncidentLogger.jsx
import React, { useState, useRef } from "react";
import {
    ShieldAlert, AlertTriangle, FileText,
    CarFront, Banknote, Camera, Video, Edit3,
    CheckCircle, Globe, Hash, Send, Clock,
    Plus, Trash2, X, RefreshCcw, Radar
} from "lucide-react";

const INITIAL_INCIDENTS = [
    {
        id: "INC-992",
        plate: "UNKNOWN",
        type: "Property Damage",
        details: "Hit AA 11223 while backing out",
        amount: null,
        time: "2 hours ago",
        status: "Admin CCTV Review Needed",
        destination: "owner"
    },
    {
        id: "INC-991",
        plate: "UN 90112",
        type: "Customer Dispute",
        details: "Driver argued aggressively about overstay penalty fee.",
        amount: null,
        time: "Yesterday",
        status: "Report Filed",
        destination: "owner"
    }
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const isFleeingType = (t) => t === "Fled Without Payment";
const isOwnerType = (t) => ["Property Damage", "Customer Dispute", "Other"].includes(t);

const pushToOwnerIncidents = (incident) => {
    try {
        const existing = JSON.parse(localStorage.getItem("vp_owner_incidents") || "[]");
        localStorage.setItem("vp_owner_incidents", JSON.stringify([incident, ...existing]));
    } catch (_) { }
};

const pushToDebtRadar = (incident) => {
    try {
        const existing = JSON.parse(localStorage.getItem("vp_debt_radar") || "[]");
        localStorage.setItem("vp_debt_radar", JSON.stringify([incident, ...existing]));
    } catch (_) { }
};

export default function IncidentLogger() {
    const [incidentType, setIncidentType] = useState("Fled Without Payment");
    const [offenderPlate, setOffenderPlate] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [damagedPlates, setDamagedPlates] = useState([""]);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(""), 5000);
    };

    const handleAddDamagedPlate = () => setDamagedPlates([...damagedPlates, ""]);
    const handleRemoveDamagedPlate = (i) => { const p = [...damagedPlates]; p.splice(i, 1); setDamagedPlates(p); };
    const handleDamagedPlateChange = (i, v) => { const p = [...damagedPlates]; p[i] = v.toUpperCase(); setDamagedPlates(p); };

    const handleFileUpload = (e, type) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setMediaFiles(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).substr(2, 9), name: f.name, type }))]);
        e.target.value = null;
    };

    const removeMedia = (id) => setMediaFiles(prev => prev.filter(m => m.id !== id));

    const clearForm = () => {
        setIncidentType("Fled Without Payment");
        setOffenderPlate("");
        setAmount("");
        setDescription("");
        setDamagedPlates([""]);
        setMediaFiles([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isDamage = incidentType === "Property Damage";

        if (!isDamage && !offenderPlate.trim()) {
            showToast("License plate is required for this incident type.", "error"); return;
        }
        if (isFleeingType(incidentType) && !amount) {
            showToast("Unpaid amount is required to flag a fleeing vehicle.", "error"); return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            const finalPlate = offenderPlate.trim() ? offenderPlate.toUpperCase() : "UNKNOWN";
            const isUnknown = finalPlate === "UNKNOWN";

            let detailsText = description;
            if (incidentType === "Property Damage") {
                const valid = damagedPlates.filter(p => p.trim());
                detailsText = valid.length ? `Hit: ${valid.join(", ")}` : description || "Property Damage";
            }

            // ── decide destination ─────────────────────────────────────────────
            const destination = isFleeingType(incidentType) ? "debt_radar" : "owner";

            const status = isUnknown
                ? "Admin CCTV Review Needed"
                : isFleeingType(incidentType)
                    ? "Global Watchlist Active"
                    : "Report Filed";

            const newIncident = {
                id: `INC-${Math.floor(100 + Math.random() * 900)}`,
                plate: finalPlate,
                type: incidentType,
                details: detailsText,
                amount: isFleeingType(incidentType) ? parseFloat(amount) || 0 : null,
                time: "Just Now",
                status,
                destination,
                // extra fields for Operations.jsx incidents tab
                branch: "Current Branch",
                zone: "N/A",
                spot: "N/A",
                date: new Date().toLocaleString(),
                plates: isDamage
                    ? damagedPlates.filter(p => p.trim())
                    : finalPlate !== "UNKNOWN" ? [finalPlate] : [],
                category: incidentType,
                description: detailsText,
                hasVideo: mediaFiles.some(m => m.type === "video"),
                hasPhoto: mediaFiles.some(m => m.type === "photo"),
            };

            // ── route to correct backend store ────────────────────────────────
            if (destination === "debt_radar") {
                pushToDebtRadar(newIncident);
            } else {
                pushToOwnerIncidents(newIncident);
            }

            setIncidents(prev => [newIncident, ...prev]);
            setIsSubmitting(false);

            if (isUnknown) {
                showToast("Report logged. Admin notified to pull CCTV for hit-and-run.");
            } else if (isFleeingType(incidentType)) {
                showToast(`DEBT RADAR: Plate ${finalPlate} added to the Global Branch Watchlist.`);
            } else {
                showToast("Incident report sent to Owner Operations Center → Incidents.");
            }

            clearForm();
        }, 1200);
    };

    const glassInput = "w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:bg-emerald-50 dark:focus:bg-emerald-500/10 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all rounded-xl";

    return (
        <div className="h-full w-full flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 relative">

            {/* TOAST */}
            {toastMessage && (
                <div className={`fixed top-16 lg:top-20 left-1/2 -translate-x-1/2 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-2xl shadow-2xl z-[8000] animate-in slide-in-from-top-4 flex items-center gap-3 w-11/12 md:w-auto text-center justify-center ${toastType === "error" ? "bg-red-600" : "bg-zinc-900 dark:bg-white dark:text-zinc-900"}`}>
                    {toastType === "error"
                        ? <AlertTriangle className="h-5 w-5 shrink-0" />
                        : <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                    {toastMessage}
                </div>
            )}

            <input type="file" accept="image/*" multiple ref={photoInputRef} onChange={e => handleFileUpload(e, "photo")} className="hidden" />
            <input type="file" accept="video/*" multiple ref={videoInputRef} onChange={e => handleFileUpload(e, "video")} className="hidden" />

            {/* ── LEFT: Form ──────────────────────────────────────────────────── */}
            <div className="flex-1 xl:max-w-[65%] flex flex-col gap-6 min-w-0">

                {/* Header */}
                <div className="bg-white dark:bg-[#121214] rounded-3xl p-5 md:p-6 shadow-sm border border-zinc-200 dark:border-white/5 shrink-0 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ShieldAlert className="h-24 w-24 md:h-32 md:w-32 text-zinc-900 dark:text-white" />
                    </div>
                    <div className="relative z-10 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 md:gap-3">
                            <AlertTriangle className="h-6 w-6 md:h-7 md:w-7 text-amber-500 shrink-0" />
                            <span className="truncate">Incident Logger</span>
                        </h2>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Fleeing vehicles → <span className="text-red-500 font-bold">Debt Radar</span> &nbsp;·&nbsp;
                            Damages & disputes → <span className="text-blue-500 font-bold">Owner Operations</span>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 p-4 md:p-8 flex flex-col min-w-0">
                    <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col min-w-0">

                        {/* Row 1: Incident Type */}
                        <div className="min-w-0">
                            <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> Select Incident Type
                            </label>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {["Fled Without Payment", "Property Damage", "Customer Dispute", "Other"].map(type => {
                                    const isFlee = isFleeingType(type);
                                    const isActive = incidentType === type;
                                    return (
                                        <button key={type} type="button"
                                            onClick={() => { setIncidentType(type); if (type !== "Property Damage" && offenderPlate === "UNKNOWN") setOffenderPlate(""); }}
                                            className={`flex-1 min-w-[140px] p-3 rounded-xl border-2 text-xs font-bold transition-all outline-none flex items-center justify-center gap-1.5 text-center cursor-pointer ${isActive
                                                ? isFlee
                                                    ? "border-red-600 bg-red-600 text-white shadow-md shadow-red-500/30"
                                                    : "border-zinc-900 bg-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md"
                                                : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20"
                                                }`}>
                                            {isFlee && <Radar className="h-3.5 w-3.5 shrink-0" />}
                                            <span className="truncate">{type}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Destination badge */}
                            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${isFleeingType(incidentType)
                                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                                : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                                }`}>
                                {isFleeingType(incidentType)
                                    ? <><Radar className="h-3.5 w-3.5" /> Sends to: Debt Radar (Global Watchlist)</>
                                    : <><FileText className="h-3.5 w-3.5" /> Sends to: Owner Operations → Incidents</>
                                }
                            </div>
                        </div>

                        {/* Row 2: Offender + Amount */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
                            <div className="min-w-0">
                                <label className="block text-[10px] md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                    <CarFront className="h-4 w-4 shrink-0" /> Offender License Plate
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={offenderPlate}
                                        onChange={e => setOffenderPlate(e.target.value.toUpperCase())}
                                        placeholder={incidentType === "Property Damage" ? "Leave blank if unknown" : "E.g. AA 12345"}
                                        className={`h-12 md:h-14 pl-12 pr-4 font-mono font-black text-base md:text-lg ${glassInput}`}
                                    />
                                </div>
                                {incidentType === "Property Damage" && (
                                    <p className="text-[9px] md:text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">
                                        *If hit-and-run, Admin will review CCTV
                                    </p>
                                )}
                            </div>

                            {isFleeingType(incidentType) && (
                                <div className="animate-in fade-in slide-in-from-top-2 min-w-0">
                                    <label className="block text-[10px] md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                        <Banknote className="h-4 w-4 shrink-0" /> Unpaid Amount (ETB)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                                        placeholder="0.00"
                                        className={`h-12 md:h-14 px-4 font-mono font-black text-base md:text-lg ${glassInput}`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Row 3: Damaged Vehicles */}
                        {incidentType === "Property Damage" && (
                            <div className="p-4 md:p-5 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-2xl space-y-4 animate-in fade-in min-w-0">
                                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0" /> Damaged Vehicle Plates
                                </label>
                                <div className="space-y-3">
                                    {damagedPlates.map((plate, index) => (
                                        <div key={index} className="flex gap-2 items-center min-w-0">
                                            <div className="relative flex-1 min-w-0">
                                                {/* plate icon */}
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Hash className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={plate}
                                                    onChange={e => handleDamagedPlateChange(index, e.target.value)}
                                                    placeholder={`Damaged plate #${index + 1} — e.g. AA 12345`}
                                                    className={`h-12 pl-9 pr-4 font-mono font-bold text-sm w-full
                                                        bg-white dark:bg-black/40
                                                        border border-zinc-300 dark:border-white/15
                                                        text-zinc-900 dark:text-white
                                                        placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                                                        placeholder:font-sans placeholder:font-normal placeholder:text-xs
                                                        focus:bg-emerald-50 dark:focus:bg-emerald-500/10
                                                        focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                                                        outline-none transition-all rounded-xl`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDamagedPlate(index)}
                                                disabled={damagedPlates.length === 1}
                                                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-200 dark:hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors outline-none cursor-pointer">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddDamagedPlate}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs md:text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 outline-none cursor-pointer">
                                    <Plus className="h-4 w-4 shrink-0" /> Add Another Damaged Vehicle
                                </button>
                            </div>
                        )}

                        {/* Row 4: Description */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                <Edit3 className="h-4 w-4 shrink-0" /> Incident Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Provide details about the incident..."
                                className={`flex-1 min-h-[100px] w-full p-4 resize-none font-medium text-sm custom-scrollbar ${glassInput}`}
                                required
                            />
                        </div>

                        {/* Row 5: Evidence */}
                        <div className="min-w-0">
                            <label className="block text-[10px] md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Evidence Upload</label>
                            <div className="flex flex-wrap gap-2 md:gap-3 mb-3">
                                <button type="button" onClick={() => photoInputRef.current.click()}
                                    className="px-4 md:px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] md:text-xs font-bold transition-colors flex items-center gap-2 outline-none cursor-pointer shadow-sm active:scale-95">
                                    <Camera className="h-4 w-4 shrink-0" /> Add Photos
                                </button>
                                <button type="button" onClick={() => videoInputRef.current.click()}
                                    className="px-4 md:px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] md:text-xs font-bold transition-colors flex items-center gap-2 outline-none cursor-pointer shadow-sm active:scale-95">
                                    <Video className="h-4 w-4 shrink-0" /> Add Video
                                </button>
                            </div>
                            {mediaFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {mediaFiles.map(file => (
                                        <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/10 rounded-lg border border-zinc-200 dark:border-white/10 max-w-full">
                                            {file.type === "photo" ? <Camera className="h-3 w-3 text-zinc-500 shrink-0" /> : <Video className="h-3 w-3 text-zinc-500 shrink-0" />}
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] md:max-w-[150px] truncate">{file.name}</span>
                                            <button type="button" onClick={() => removeMedia(file.id)} className="ml-1 text-red-500 hover:text-red-700 outline-none cursor-pointer shrink-0">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 md:pt-6 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 md:gap-4">
                            <button type="button" onClick={clearForm}
                                className="w-full sm:flex-1 py-3.5 md:py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-bold transition-colors outline-none cursor-pointer shadow-sm active:scale-95 text-sm">
                                Clear Form
                            </button>
                            <button type="submit" disabled={isSubmitting}
                                className={`w-full sm:flex-[2] py-3.5 md:py-4 font-black rounded-xl shadow-lg active:scale-95 transition-all outline-none flex items-center justify-center gap-2 md:gap-3 cursor-pointer disabled:opacity-70 text-sm md:text-base ${isFleeingType(incidentType)
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20"
                                    }`}>
                                {isSubmitting ? (
                                    <span className="animate-pulse flex items-center gap-2">
                                        <RefreshCcw className="h-4 w-4 md:h-5 md:w-5 animate-spin shrink-0" /> Processing...
                                    </span>
                                ) : isFleeingType(incidentType) ? (
                                    <><Radar className="h-4 w-4 md:h-5 md:w-5 shrink-0" /><span className="truncate">Flag to Debt Radar</span></>
                                ) : (
                                    <><CheckCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0" /><span className="truncate">Send to Owner Operations</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── RIGHT: Incident Log ──────────────────────────────────────────── */}
            <div className="w-full xl:w-[35%] h-[500px] md:h-[600px] xl:h-auto bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col shrink-0 min-w-0">
                <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-inner shrink-0">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-lg md:text-xl text-zinc-900 dark:text-white leading-none truncate">Incident Log</h3>
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1 truncate">Recent Reports</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                    {incidents.map(inc => {
                        const isFled = inc.type === "Fled Without Payment";
                        const isUnknown = inc.plate === "UNKNOWN";
                        return (
                            <div key={inc.id} className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-3 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <span className={`font-mono font-black text-xs md:text-sm px-2 py-0.5 rounded tracking-widest truncate max-w-[120px] md:max-w-[150px] inline-block ${isUnknown ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400"
                                            : isFled ? "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400"
                                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                            }`}>{inc.plate}</span>
                                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase mt-2 truncate">{inc.type}</p>
                                        {inc.details && <p className="text-[9px] md:text-[10px] font-medium text-zinc-400 mt-1 line-clamp-2">{inc.details}</p>}
                                    </div>
                                    {isFled && (
                                        <div className="text-right shrink-0">
                                            <span className="font-black text-sm md:text-base text-red-600 dark:text-red-400">{inc.amount?.toFixed(2)} ETB</span>
                                        </div>
                                    )}
                                </div>

                                {/* Destination tag */}
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest w-fit ${inc.destination === "debt_radar"
                                    ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    }`}>
                                    {inc.destination === "debt_radar"
                                        ? <><Radar className="h-2.5 w-2.5" /> Debt Radar</>
                                        : <><FileText className="h-2.5 w-2.5" /> Owner Operations</>
                                    }
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-white/5 gap-2">
                                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 truncate ${isUnknown ? "text-amber-500" : isFled ? "text-red-500" : "text-emerald-500"
                                        }`}>
                                        {isUnknown ? <Camera className="h-3 w-3 shrink-0" />
                                            : isFled ? <Radar className="h-3 w-3 shrink-0" />
                                                : <CheckCircle className="h-3 w-3 shrink-0" />}
                                        <span className="truncate">{inc.status}</span>
                                    </span>
                                    <p className="text-[8px] md:text-[10px] font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                                        <Clock className="h-3 w-3" /> {inc.time}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-4 text-center">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of recent logs</p>
                    </div>
                </div>
            </div>
        </div>
    );
}