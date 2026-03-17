import React, { useState, useRef } from "react";
import {
    ShieldAlert, AlertTriangle, FileText,
    CarFront, Banknote, Camera, Video, Edit3,
    CheckCircle, Globe, Hash, Send, Clock,
    Plus, Trash2, X, RefreshCcw
} from "lucide-react";

// --- MOCK RECENT INCIDENTS ---
const INITIAL_INCIDENTS = [
    {
        id: "INC-992",
        plate: "UNKNOWN",
        type: "Property Damage",
        details: "Hit AA 11223 while backing out",
        amount: null,
        time: "2 hours ago",
        status: "Admin CCTV Review Needed"
    },
    {
        id: "INC-991",
        plate: "UN 90112",
        type: "Customer Dispute",
        details: "Driver argued aggressively about overstay penalty fee.",
        amount: null,
        time: "Yesterday",
        status: "Report Filed"
    }
];

export default function IncidentLogger() {
    // Form State
    const [incidentType, setIncidentType] = useState("Fled Without Payment");
    const [offenderPlate, setOffenderPlate] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // Dynamic Arrays for Damage & Media
    const [damagedPlates, setDamagedPlates] = useState([""]);
    const [mediaFiles, setMediaFiles] = useState([]);

    // Processing State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success"); // 'success' | 'error'

    // Hidden File Inputs
    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(""), 5000);
    };

    // --- DYNAMIC FIELD HANDLERS ---
    const handleAddDamagedPlate = () => setDamagedPlates([...damagedPlates, ""]);

    const handleRemoveDamagedPlate = (index) => {
        const newPlates = [...damagedPlates];
        newPlates.splice(index, 1);
        setDamagedPlates(newPlates);
    };

    const handleDamagedPlateChange = (index, value) => {
        const newPlates = [...damagedPlates];
        newPlates[index] = value.toUpperCase();
        setDamagedPlates(newPlates);
    };

    // --- MEDIA HANDLERS ---
    const handleFileUpload = (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newMedia = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: type
        }));

        setMediaFiles([...mediaFiles, ...newMedia]);
        e.target.value = null;
    };

    const removeMedia = (id) => {
        setMediaFiles(mediaFiles.filter(m => m.id !== id));
    };

    const clearForm = () => {
        setIncidentType("Fled Without Payment");
        setOffenderPlate("");
        setAmount("");
        setDescription("");
        setDamagedPlates([""]);
        setMediaFiles([]);
    };

    // --- SUBMISSION LOGIC ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // ✅ STRICT VALIDATION RULE: Plate is only optional for Property Damage
        const isPropertyDamage = incidentType === "Property Damage";
        if (!isPropertyDamage && !offenderPlate.trim()) {
            showToast("License plate is required for this incident type.", "error");
            return;
        }

        if (incidentType === "Fled Without Payment" && !amount) {
            showToast("Unpaid amount is required to flag a fleeing vehicle.", "error");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            const finalPlate = offenderPlate.trim() ? offenderPlate.toUpperCase() : "UNKNOWN";
            const isUnknown = finalPlate === "UNKNOWN";

            let detailsText = "";
            if (incidentType === "Property Damage") {
                const validDamaged = damagedPlates.filter(p => p.trim() !== "");
                detailsText = validDamaged.length > 0 ? `Hit: ${validDamaged.join(", ")}` : "Property Damage";
            } else if (incidentType === "Customer Dispute") {
                detailsText = "Aggressive or argumentative driver";
            }

            const newIncident = {
                id: `INC-${Math.floor(100 + Math.random() * 900)}`,
                plate: finalPlate,
                type: incidentType,
                details: detailsText,
                amount: incidentType === "Fled Without Payment" ? parseFloat(amount) || 0 : null,
                time: "Just Now",
                status: isUnknown ? "Admin CCTV Review Needed" : (incidentType === "Fled Without Payment" ? "Global Watchlist Active" : "Report Filed")
            };

            setIncidents([newIncident, ...incidents]);
            setIsSubmitting(false);

            // Dynamic success messages
            if (isUnknown) {
                showToast(`Report logged. Admin notified to pull CCTV for hit-and-run.`);
            } else if (incidentType === "Fled Without Payment") {
                showToast(`ALERT: Plate ${finalPlate} added to the Global Branch Watchlist.`);
            } else {
                showToast("Incident report successfully filed to management.");
            }

            clearForm();
        }, 1200);
    };

    // --- REUSABLE GLASS GREEN INPUT STYLES ---
    const glassGreenInputStyles = "w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:bg-emerald-50 dark:focus:bg-emerald-500/10 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all rounded-xl";

    return (
        <div className="h-full w-full flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 relative">

            {/* Toast Notification */}
            {toastMessage && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-2xl z-[8000] animate-in slide-in-from-top-4 flex items-center gap-3 ${toastType === 'error' ? 'bg-red-600' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'}`}>
                    {toastType === 'error' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                    {toastMessage}
                </div>
            )}

            {/* Hidden File Inputs */}
            <input type="file" accept="image/*" multiple ref={photoInputRef} onChange={(e) => handleFileUpload(e, 'photo')} className="hidden" />
            <input type="file" accept="video/*" multiple ref={videoInputRef} onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />

            {/* LEFT COLUMN: Report Form */}
            <div className="flex-1 xl:max-w-[65%] flex flex-col gap-6">

                {/* Header */}
                <div className="bg-white dark:bg-[#121214] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5 shrink-0 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ShieldAlert className="h-32 w-32 text-zinc-900 dark:text-white" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                            <AlertTriangle className="h-7 w-7 text-amber-500" /> Incident Logger
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Report manually registered fleeing vehicles, damages, or disputes.</p>
                    </div>
                </div>

                {/* Main Form */}
                <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 p-6 md:p-8 flex flex-col">
                    <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">

                        {/* Row 1: Incident Type */}
                        <div>
                            <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Select Incident Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {["Fled Without Payment", "Property Damage", "Customer Dispute", "Other"].map((type) => {
                                    const isSelected = incidentType === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setIncidentType(type);
                                                if (type !== "Property Damage" && offenderPlate === "UNKNOWN") setOffenderPlate("");
                                            }}
                                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all outline-none flex items-center justify-center text-center cursor-pointer ${isSelected
                                                    ? 'border-zinc-900 bg-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md'
                                                    : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 2: Offender Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                    <CarFront className="h-4 w-4" /> Offender License Plate
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={offenderPlate}
                                        onChange={(e) => setOffenderPlate(e.target.value.toUpperCase())}
                                        placeholder={incidentType === "Property Damage" ? "Leave blank if unknown" : "E.g. AA 12345 (Required)"}
                                        className={`h-14 pl-12 pr-4 font-mono font-black text-lg ${glassGreenInputStyles}`}
                                    />
                                </div>
                                {/* Helper text ONLY shows for Property Damage */}
                                {incidentType === "Property Damage" && (
                                    <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">
                                        *If unknown hit-and-run, Admin will review CCTV
                                    </p>
                                )}
                            </div>

                            {/* Amount only shows if they fled without payment */}
                            {incidentType === "Fled Without Payment" && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                        <Banknote className="h-4 w-4" /> Unpaid Amount (ETB)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        placeholder="0.00"
                                        className={`h-14 px-4 font-mono font-black text-lg ${glassGreenInputStyles}`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Row 3: Property Damage Specifics (The "Lazy Driver" Tracker) */}
                        {incidentType === "Property Damage" && (
                            <div className="p-5 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-2xl space-y-4 animate-in fade-in">
                                <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4" /> Damaged Vehicles
                                </label>

                                <div className="space-y-3">
                                    {damagedPlates.map((plate, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={plate}
                                                onChange={(e) => handleDamagedPlateChange(index, e.target.value)}
                                                placeholder="Damaged Plate # (e.g. AA 99887)"
                                                className={`h-12 px-4 font-mono font-bold text-base flex-1 ${glassGreenInputStyles}`}
                                            />
                                            {/* Premium Red for Delete Action */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDamagedPlate(index)}
                                                disabled={damagedPlates.length === 1}
                                                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-200 dark:hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none cursor-pointer"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Blue for Continue/Add Action */}
                                <button
                                    type="button"
                                    onClick={handleAddDamagedPlate}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 outline-none cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" /> Add Another Damaged Vehicle
                                </button>
                            </div>
                        )}

                        {/* Row 4: Description */}
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                                <Edit3 className="h-4 w-4" /> Incident Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide details about the incident, damages, or dispute..."
                                className={`flex-1 min-h-[100px] p-4 resize-none font-medium text-sm custom-scrollbar ${glassGreenInputStyles}`}
                                required
                            />
                        </div>

                        {/* Row 5: Media Uploads */}
                        <div>
                            <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Evidence Upload</label>

                            <div className="flex flex-wrap gap-3 mb-3">
                                {/* Blue for Continue/Add Media Actions */}
                                <button type="button" onClick={() => photoInputRef.current.click()} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 outline-none cursor-pointer shadow-sm active:scale-95">
                                    <Camera className="h-4 w-4" /> Add Photos
                                </button>
                                <button type="button" onClick={() => videoInputRef.current.click()} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 outline-none cursor-pointer shadow-sm active:scale-95">
                                    <Video className="h-4 w-4" /> Add Video
                                </button>
                            </div>

                            {/* Uploaded Files Indicator */}
                            {mediaFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {mediaFiles.map((file) => (
                                        <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/10 rounded-lg border border-zinc-200 dark:border-white/10">
                                            {file.type === 'photo' ? <Camera className="h-3 w-3 text-zinc-500" /> : <Video className="h-3 w-3 text-zinc-500" />}
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">{file.name}</span>
                                            {/* Premium Red for Delete Action */}
                                            <button type="button" onClick={() => removeMedia(file.id)} className="ml-1 text-red-500 hover:text-red-700 outline-none cursor-pointer">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="pt-6 border-t border-zinc-100 dark:border-white/5 flex gap-4">

                            {/* Premium Black for Cancel/Back */}
                            <button
                                type="button"
                                onClick={clearForm}
                                className="flex-1 py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-bold transition-colors outline-none cursor-pointer shadow-sm active:scale-95"
                            >
                                Clear Form
                            </button>

                            {/* Premium Green for Submit/Save/Resolve Actions */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse flex items-center gap-2"><RefreshCcw className="h-5 w-5 animate-spin" /> Processing...</span>
                                ) : incidentType === "Fled Without Payment" ? (
                                    <>File Report & Hunt <Globe className="h-5 w-5" /></>
                                ) : (
                                    <>Save Incident Report <CheckCircle className="h-5 w-5" /></>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* RIGHT COLUMN: Recent Incident Log */}
            <div className="w-full xl:w-[35%] h-[600px] xl:h-auto bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col shrink-0">

                <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-[#18181b] rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-inner">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-zinc-900 dark:text-white leading-none">Incident Log</h3>
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1">Recent Reports</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                    {incidents.map((inc) => {
                        const isFled = inc.type === "Fled Without Payment";
                        const isUnknown = inc.plate === "UNKNOWN";

                        return (
                            <div key={inc.id} className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-3 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">

                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`font-mono font-black text-sm px-2 py-0.5 rounded tracking-widest ${isUnknown ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' :
                                                isFled ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400' :
                                                    'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                            }`}>
                                            {inc.plate}
                                        </span>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2">{inc.type}</p>
                                        {inc.details && <p className="text-[10px] font-medium text-zinc-400 mt-1">{inc.details}</p>}
                                    </div>
                                    {isFled && (
                                        <div className="text-right">
                                            <span className="font-black text-red-600 dark:text-red-400">{inc.amount?.toFixed(2)} ETB</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-white/5">
                                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isUnknown ? 'text-amber-500' :
                                            isFled ? 'text-red-500' :
                                                'text-emerald-500'
                                        }`}>
                                        {isUnknown ? <Camera className="h-3 w-3" /> : isFled ? <Globe className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                        {inc.status}
                                    </span>
                                    <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {inc.time}</p>
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of recent logs</p>
                    </div>
                </div>

            </div>

        </div>
    );
}