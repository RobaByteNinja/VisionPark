import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
    UserCircle, ShieldCheck, Key, Smartphone, Monitor, History,
    AlertTriangle, Download, Trash2, CheckCircle, XCircle, Copy,
    Check, Edit3, X, QrCode, Lock, RefreshCw, Activity, ShieldAlert,
    Camera, Upload, Eye, EyeOff, User, Mail, Phone, Wand2,
    Save, ArrowRight
} from "lucide-react";

// --- MOCK DATA ---
const MOCK_ACCESS_LOG = [
    { id: 1, time: "Today, 08:32 AM", action: "Login", ip: "196.189.15.122", device: "Chrome / Windows", status: "Success" },
    { id: 2, time: "Yesterday, 10:15 AM", action: "Config Updated", ip: "196.189.15.122", device: "Chrome / Windows", status: "Success" },
    { id: 3, time: "Feb 10, 2026, 04:00 PM", action: "Session Terminated", ip: "196.189.15.122", device: "Safari / macOS", status: "Success" },
    { id: 4, time: "Feb 08, 2026, 11:22 AM", action: "Login", ip: "10.0.0.45", device: "Unknown", status: "Failed" },
    { id: 5, time: "Feb 03, 2026, 09:10 AM", action: "Password Changed", ip: "196.189.15.122", device: "Chrome / Windows", status: "Success" },
];

const getPasswordStrength = (pass) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/3", text: "text-red-500" };
    if (score === 3 || score === 4) return { label: "Fair", color: "bg-amber-500", width: "w-2/3", text: "text-amber-500" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full", text: "text-emerald-500" };
};

// ─── VALIDATION HELPERS ────────────────────────────────────────────────────────

/**
 * Accepted email types:
 *  • Gmail      – @gmail.com
 *  • Yahoo      – @yahoo.<anything>  |  @ymail.com
 *  • Organisation / country – any well-formed email whose domain carries a
 *    recognised organisational TLD (.com .org .net .edu .gov .io .co .biz
 *    .info .ac .sch) or a two-letter country code TLD (e.g. .et .uk .de)
 */
const VALID_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
const YAHOO_RE = /^[^\s@]+@(yahoo\.[a-z]{2,}|ymail\.com)$/i;
const ORG_TLD_RE = /\.(com|org|net|edu|gov|int|mil|io|co|biz|info|ac|sch)(\.[a-z]{2})?$/i;
const COUNTRY_TLD_RE = /\.[a-z]{2}$/i;      // catches any two-letter ccTLD

const isValidEmail = (email) => {
    if (!VALID_FORMAT_RE.test(email)) return false;
    if (GMAIL_RE.test(email)) return true;
    if (YAHOO_RE.test(email)) return true;
    const domain = email.split("@")[1] || "";
    if (ORG_TLD_RE.test(domain)) return true;
    if (COUNTRY_TLD_RE.test(domain)) return true;
    return false;
};

/**
 * Valid Ethiopian phone numbers:
 *   International : +251  followed by 9 or 7, then exactly 8 digits
 *   Local         : 0     followed by 9 or 7, then exactly 8 digits
 */
const PHONE_RE = /^(\+251[79]\d{8}|0[79]\d{8})$/;
const isValidPhone = (phone) => PHONE_RE.test(phone.replace(/\s/g, ""));

export default function AdminProfile() {
    const context = useOutletContext() || {};
    const showToast = context.showToast || ((msg, type) => alert(`[${type.toUpperCase()}] ${msg}`));

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // --- PROFILE STATE ---
    const [profile, setProfile] = useState({
        name: localStorage.getItem("vp_admin_name") || "System Admin",
        email: localStorage.getItem("vp_admin_email") || "admin@visionpark.et",
        phone: localStorage.getItem("vp_admin_phone") || "0911234567",
        avatar: localStorage.getItem("vp_admin_avatar") || null,
        id: "ADMIN-001",
        role: "IT Administrator",
        created: "January 15, 2026",
        lastLogin: "Today, 08:32 AM — Addis Ababa, ET",
        lastPwdChange: "February 3, 2026"
    });

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: profile.name, email: profile.email, phone: profile.phone });
    const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });
    const [isCopied, setIsCopied] = useState(false);

    const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // --- SECURITY STATE ---
    const [pwdForm, setPwdForm] = useState({ current: "", new: "", confirm: "" });
    // true  = visible (Eye    icon shown — open eye means you can see the password)
    // false = hidden  (EyeOff icon shown — struck eye means the password is obscured)
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

    // --- 2FA & DANGER ZONE STATE ---
    const [is2FAEnabled, setIs2FAEnabled] = useState(localStorage.getItem("vp_admin_2fa") === "true");
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFAStep, setTwoFAStep] = useState(1);
    const [twoFACode, setTwoFACode] = useState("");
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetForm, setResetForm] = useState({ confirmText: "", password: "" });
    const [isResetting, setIsResetting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // --- ACTIVE SESSIONS STATE ---
    const INITIAL_OTHER_SESSIONS = [
        { id: "SESS-iOS", device: "Safari on iOS", icon: "mobile", ip: "10.0.0.45", ago: "2 hours ago" },
        { id: "SESS-AND", device: "Chrome on Android", icon: "mobile", ip: "197.156.33.21", ago: "4 hours ago" },
    ];
    const [otherSessions, setOtherSessions] = useState(INITIAL_OTHER_SESSIONS);
    const [revokingId, setRevokingId] = useState(null);
    const [terminateAllPhase, setTerminateAllPhase] = useState("idle"); // idle | confirming | terminating | done

    // --- CAMERA LOGIC ---
    const startCamera = async () => {
        setPhotoMenuOpen(false);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            showToast("Camera access denied or unavailable on this device.", "error");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current, canvas = canvasRef.current;
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageUrl = canvas.toDataURL('image/png');
            try {
                localStorage.setItem("vp_admin_avatar", imageUrl);
                setProfile(p => ({ ...p, avatar: imageUrl }));
                // Notify AdminLayout so the sidebar/header avatar updates immediately
                window.dispatchEvent(new CustomEvent("vp_profile_updated"));
                showToast("Profile photo captured successfully.", "success");
            } catch {
                showToast("Failed to save photo. Local storage might be full.", "error");
            }
            stopCamera();
        }
    };

    useEffect(() => { return () => stopCamera(); }, []);

    // --- HANDLERS: PROFILE ---
    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(profile.id);
            setIsCopied(true);
            showToast("Admin ID copied to clipboard.", "success");
            setTimeout(() => setIsCopied(false), 2000);
        } catch {
            showToast("Failed to copy to clipboard.", "error");
        }
    };

    const handleSaveProfile = () => {
        // Collect all field errors first so every field shows its error at once
        const errors = { email: "", phone: "" };
        let hasError = false;

        if (!editForm.name.trim()) {
            showToast("Full name cannot be empty.", "error");
            hasError = true;
        }
        if (!isValidEmail(editForm.email)) {
            errors.email = "Enter a valid Gmail, Yahoo, organisation or country email.";
            hasError = true;
        }
        const cleanPhone = editForm.phone.replace(/\s/g, "");
        if (!isValidPhone(cleanPhone)) {
            errors.phone = "Use +251(9/7) + 8 digits  or  0(9/7) + 8 digits.";
            hasError = true;
        }

        setFieldErrors(errors);
        if (hasError) return;

        localStorage.setItem("vp_admin_name", editForm.name);
        localStorage.setItem("vp_admin_email", editForm.email);
        localStorage.setItem("vp_admin_phone", cleanPhone);
        setProfile({ ...profile, name: editForm.name, email: editForm.email, phone: cleanPhone });
        setFieldErrors({ email: "", phone: "" });
        setIsEditingProfile(false);
        // Notify AdminLayout so the sidebar/header name updates immediately
        window.dispatchEvent(new CustomEvent("vp_profile_updated"));
        showToast("Profile information updated successfully.", "success");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast("Image too large. Please select an image under 2MB.", "error"); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                localStorage.setItem("vp_admin_avatar", reader.result);
                setProfile(p => ({ ...p, avatar: reader.result }));
                // Notify AdminLayout so the sidebar/header avatar updates immediately
                window.dispatchEvent(new CustomEvent("vp_profile_updated"));
                showToast("Profile photo uploaded successfully.", "success");
            } catch {
                showToast("Failed to save image. Browser storage full.", "error");
            }
        };
        reader.readAsDataURL(file);
        setPhotoMenuOpen(false);
        e.target.value = null;
    };

    const handleRemovePhoto = () => {
        localStorage.removeItem("vp_admin_avatar");
        setProfile(p => ({ ...p, avatar: null }));
        setPhotoMenuOpen(false);
        // Notify AdminLayout so the sidebar/header avatar updates immediately
        window.dispatchEvent(new CustomEvent("vp_profile_updated"));
        showToast("Profile photo removed.", "success");
    };

    // --- HANDLERS: PASSWORD ---
    /**
     * Eye    (showPasswords[field] === true)  → password is VISIBLE → click to HIDE
     * EyeOff (showPasswords[field] === false) → password is HIDDEN  → click to SHOW
     */
    const togglePasswordVisibility = (e, field) => {
        e.preventDefault();
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const disableCopyPaste = (e) => e.preventDefault();

    const generateStrongPassword = (e) => {
        e.preventDefault();
        const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        // Guarantee one of each required class, then pad to 14 chars
        let pass = "A" + "a" + "1" + "!";
        for (let i = 0; i < 10; i++) pass += all.charAt(Math.floor(Math.random() * all.length));
        pass = pass.split('').sort(() => 0.5 - Math.random()).join('');

        setPwdForm(p => ({ ...p, new: pass, confirm: pass }));
        setShowPasswords(p => ({ ...p, new: true, confirm: true }));
        showToast("Strong password auto-generated.", "success");
    };

    const passStrength = getPasswordStrength(pwdForm.new);
    const isPwdValid = passStrength && passStrength.label !== "Weak"
        && pwdForm.new === pwdForm.confirm
        && pwdForm.current.length > 0;

    const handleUpdatePassword = () => {
        if (!isPwdValid) return;
        setIsUpdatingPwd(true);
        setTimeout(() => {
            setIsUpdatingPwd(false);
            setPwdForm({ current: "", new: "", confirm: "" });
            setShowPasswords({ current: false, new: false, confirm: false });
            setProfile(p => ({ ...p, lastPwdChange: "Just Now" }));
            showToast("Password updated successfully. All other sessions terminated.", "success");
        }, 1500);
    };

    // --- HANDLERS: 2FA ---
    const handleVerify2FA = () => {
        if (twoFACode.length !== 6) return;
        setIsVerifying2FA(true);
        setTimeout(() => {
            setIsVerifying2FA(false);
            if (twoFACode === "123456") {
                setTwoFAStep(3); setIs2FAEnabled(true);
                localStorage.setItem("vp_admin_2fa", "true");
            } else {
                showToast("Invalid verification code. Try '123456'.", "error");
            }
        }, 1000);
    };

    const close2FAModal = () => {
        setShow2FAModal(false);
        setTimeout(() => { setTwoFAStep(1); setTwoFACode(""); }, 300);
    };

    // --- HANDLERS: SESSIONS ---
    const handleRevokeSession = (id) => {
        setRevokingId(id);
        setTimeout(() => {
            setOtherSessions(prev => prev.filter(s => s.id !== id));
            setRevokingId(null);
            showToast("Session revoked. Device has been signed out.", "success");
        }, 1200);
    };

    const handleTerminateAllSessions = () => {
        if (terminateAllPhase === "idle" && otherSessions.length === 0) return;

        if (terminateAllPhase === "idle") {
            // Step 1 — enter confirm state (button turns into "Are you sure?" inline)
            setTerminateAllPhase("confirming");
            return;
        }

        if (terminateAllPhase === "confirming") {
            // Step 2 — start the actual termination sequence
            setTerminateAllPhase("terminating");
            showToast("Terminating all other sessions…", "success");

            // Stagger-remove sessions one by one to simulate real API calls
            const ids = otherSessions.map(s => s.id);
            ids.forEach((id, i) => {
                setTimeout(() => {
                    setOtherSessions(prev => prev.filter(s => s.id !== id));
                }, 500 + i * 600);
            });

            // Mark done after all sessions are gone
            setTimeout(() => {
                setTerminateAllPhase("done");
                showToast(`${ids.length} session${ids.length !== 1 ? "s" : ""} terminated. All other devices have been signed out.`, "success");
                // Auto-reset the done state after 3 s
                setTimeout(() => setTerminateAllPhase("idle"), 3000);
            }, 500 + ids.length * 600 + 400);
        }
    };

    const cancelTerminateAll = () => setTerminateAllPhase("idle");

    // --- HANDLERS: EXPORT & RESET ---
    const handleExportData = () => {
        setIsExporting(true);
        setTimeout(() => {
            const blob = new Blob([JSON.stringify({ profile, config_history: MOCK_ACCESS_LOG }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `VisionPark_Admin_Data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsExporting(false);
            showToast("Admin data exported successfully.", "success");
        }, 1500);
    };

    const handleResetAccount = () => {
        setIsResetting(true);
        setTimeout(() => {
            localStorage.clear();
            setProfile(p => ({ ...p, name: "System Admin", email: "admin@visionpark.et", phone: "0911234567", avatar: null }));
            setIs2FAEnabled(false);
            setIsResetting(false); setShowResetModal(false);
            setResetForm({ confirmText: "", password: "" });
            // Notify AdminLayout so the sidebar/header reverts to defaults immediately
            window.dispatchEvent(new CustomEvent("vp_profile_updated"));
            showToast("Admin account reset to factory defaults.", "success");
        }, 2000);
    };

    const isResetValid = resetForm.confirmText === "RESET" && resetForm.password.length > 3;

    // Phone input: allow only digits and leading +, enforce max length automatically
    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/[^\d+\s]/g, "");
        // + is only valid at the start
        if (val.indexOf("+") > 0) val = val.replace(/\+/g, "");
        const maxLen = val.startsWith("+") ? 13 : 10;   // +251XXXXXXXXX or 0XXXXXXXXX
        setEditForm({ ...editForm, phone: val.slice(0, maxLen) });
    };

    // Eye    icon → password is currently VISIBLE → click to HIDE
    // EyeOff icon → password is currently HIDDEN  → click to SHOW
    // Cursor position is saved before the type switch and restored after re-render.
    const eyeBtn = (field) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}   // prevent input blur
            onClick={(e) => {
                // Walk up to the wrapper div and find the sibling input
                const input = e.currentTarget.closest("div")?.querySelector("input");
                const start = input?.selectionStart ?? null;
                const end = input?.selectionEnd ?? null;

                setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

                // After React flushes the type change, restore cursor and focus
                if (input) {
                    requestAnimationFrame(() => {
                        input.focus();
                        if (start !== null) input.setSelectionRange(start, end);
                    });
                }
            }}
            title={showPasswords[field] ? "Hide password" : "Show password"}
            className="absolute right-2 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white outline-none rounded-lg transition-colors"
        >
            {showPasswords[field]
                ? <Eye className="h-4 w-4" />
                : <EyeOff className="h-4 w-4" />
            }
        </button>
    );

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UserCircle className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-500 shrink-0" />
                        Admin Profile
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your system administrator account and security settings.</p>
                </div>
            </div>

            {/* 2 & 3. PROFILE OVERVIEW / EDIT CARD */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden shrink-0 relative transition-all">

                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                {isEditingProfile ? (
                    // ── EDIT MODE ──────────────────────────────────────────────
                    <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-8 items-center md:items-start">

                        {/* Avatar picker */}
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div className="relative group cursor-pointer" onClick={() => setPhotoMenuOpen(v => !v)}>
                                <div className="h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-4 border-white dark:border-[#18181b] shadow-xl transition-all">
                                    {profile.avatar
                                        ? <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                                        : <span className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400">SA</span>
                                    }
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>

                                {photoMenuOpen && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-2.5 w-full p-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg outline-none transition-colors">
                                            <Upload className="h-4 w-4 text-indigo-500" /> Upload Photo
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); startCamera(); }} className="flex items-center gap-2.5 w-full p-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg outline-none transition-colors">
                                            <Camera className="h-4 w-4 text-blue-500" /> Take Photo
                                        </button>
                                        {profile.avatar && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }} className="flex items-center gap-2.5 w-full p-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg outline-none transition-colors border-t border-zinc-100 dark:border-white/5 mt-1">
                                                <X className="h-4 w-4" /> Remove Photo
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form fields */}
                        <div className="flex-1 w-full space-y-5">
                            <div className="flex items-center border-b border-zinc-100 dark:border-white/5 pb-4">
                                <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Edit3 className="h-5 w-5 text-indigo-500" /> Edit Profile Details
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name</label>
                                    <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl focus-within:border-indigo-500 transition-all">
                                        <User className="absolute left-4 h-4 w-4 text-zinc-400" />
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-bold pl-11 pr-4 py-3 outline-none" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                                    <div className={`relative flex items-center bg-zinc-50 dark:bg-black/40 border rounded-xl focus-within:border-indigo-500 transition-all ${fieldErrors.email ? 'border-red-500 focus-within:border-red-500' : 'border-zinc-200 dark:border-white/10'}`}>
                                        <Mail className={`absolute left-4 h-4 w-4 ${fieldErrors.email ? 'text-red-400' : 'text-zinc-400'}`} />
                                        <input type="email" value={editForm.email}
                                            onChange={e => {
                                                setEditForm({ ...editForm, email: e.target.value });
                                                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                                            }}
                                            placeholder="name@gmail.com"
                                            className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-bold pl-11 pr-4 py-3 outline-none" />
                                    </div>
                                    {fieldErrors.email
                                        ? <p className="text-[10px] font-bold text-red-500 pl-1 flex items-center gap-1"><XCircle className="h-3 w-3 shrink-0" />{fieldErrors.email}</p>
                                        : <p className="text-[10px] text-zinc-400 pl-1">Gmail, Yahoo, organisation or country email</p>
                                    }
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                                    <div className={`relative flex items-center bg-zinc-50 dark:bg-black/40 border rounded-xl focus-within:border-indigo-500 transition-all ${fieldErrors.phone ? 'border-red-500 focus-within:border-red-500' : 'border-zinc-200 dark:border-white/10'}`}>
                                        <Phone className={`absolute left-4 h-4 w-4 ${fieldErrors.phone ? 'text-red-400' : 'text-zinc-400'}`} />
                                        <input type="tel" value={editForm.phone}
                                            onChange={e => {
                                                handlePhoneChange(e);
                                                if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: "" }));
                                            }}
                                            placeholder="+2519XXXXXXXX or 09XXXXXXXX"
                                            className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-mono tracking-wider font-bold pl-11 pr-4 py-3 outline-none" />
                                    </div>
                                    {fieldErrors.phone
                                        ? <p className="text-[10px] font-bold text-red-500 pl-1 flex items-center gap-1"><XCircle className="h-3 w-3 shrink-0" />{fieldErrors.phone}</p>
                                        : <p className="text-[10px] text-zinc-400 pl-1">+251(9/7) + 8 digits &nbsp;or&nbsp; 0(9/7) + 8 digits</p>
                                    }
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                <button type="button" onClick={() => { setIsEditingProfile(false); setFieldErrors({ email: "", phone: "" }); }}
                                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95">
                                    Cancel
                                </button>
                                <button type="button" onClick={handleSaveProfile}
                                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2">
                                    <Save className="h-4 w-4 shrink-0" /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>

                ) : (
                    // ── VIEW MODE ──────────────────────────────────────────────
                    <div className="p-6 md:p-8 animate-in fade-in duration-200 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div className="h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-4 border-white dark:border-[#18181b] shadow-xl">
                                {profile.avatar
                                    ? <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                                    : <span className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400">SA</span>
                                }
                            </div>
                            <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 shadow-sm text-center">
                                {profile.role}
                            </span>
                        </div>

                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mt-2 md:mt-0">
                            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/5 pb-4">
                                <div className="min-w-0 pr-4">
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white truncate">{profile.name}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                        <p className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 truncate">
                                            <Mail className="h-3.5 w-3.5 shrink-0" /> {profile.email}
                                        </p>
                                        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                                        <p className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 truncate">
                                            <Phone className="h-3.5 w-3.5 shrink-0" /> <span className="font-mono">{profile.phone}</span>
                                        </p>
                                    </div>
                                </div>
                                <button type="button"
                                    onClick={() => { setEditForm({ name: profile.name, email: profile.email, phone: profile.phone }); setFieldErrors({ email: "", phone: "" }); setIsEditingProfile(true); }}
                                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-white dark:bg-[#18181b] border-2 border-indigo-100 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 shrink-0">
                                    <Edit3 className="h-4 w-4" /> Edit Profile
                                </button>
                            </div>

                            {[
                                { label: "Admin ID", value: <div className="flex items-center gap-2"><span className="text-sm font-mono font-black text-zinc-900 dark:text-white">{profile.id}</span><button type="button" onClick={handleCopyId} className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors outline-none">{isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}</button></div> },
                                { label: "Account Created", value: <p className="text-sm font-bold text-zinc-900 dark:text-white">{profile.created}</p> },
                                { label: "Last Login", value: <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{profile.lastLogin}</p> },
                                { label: "Last Password Change", value: <p className="text-sm font-bold text-zinc-900 dark:text-white">{profile.lastPwdChange}</p> },
                            ].map(({ label, value }) => (
                                <div key={label} className="space-y-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                                    {value}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 relative z-10">

                {/* 4. SECURITY SETTINGS */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-500" /> Security Settings
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Authentication & Access Control</p>
                        </div>

                        <div className="p-5 sm:p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">

                            {/* A. Change Password */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Key className="h-4 w-4 text-zinc-400" /> Change Password
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Current Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Password</label>
                                        <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl focus-within:border-indigo-500 transition-all">
                                            <Key className="absolute left-4 h-4 w-4 text-zinc-400" />
                                            <input type={showPasswords.current ? "text" : "password"} value={pwdForm.current}
                                                onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })}
                                                onCopy={disableCopyPaste} onPaste={disableCopyPaste} onCut={disableCopyPaste}
                                                placeholder="••••••••"
                                                className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-mono font-bold pl-11 pr-12 py-3 outline-none" />
                                            {eyeBtn("current")}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* New Password */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">New Password</label>
                                                <button type="button" onClick={generateStrongPassword} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 outline-none transition-colors">
                                                    <Wand2 className="h-3 w-3" /> Auto-generate
                                                </button>
                                            </div>
                                            <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl focus-within:border-indigo-500 transition-all">
                                                <Key className="absolute left-4 h-4 w-4 text-zinc-400" />
                                                <input type={showPasswords.new ? "text" : "password"} value={pwdForm.new}
                                                    onChange={e => setPwdForm({ ...pwdForm, new: e.target.value })}
                                                    onCopy={disableCopyPaste} onPaste={disableCopyPaste} onCut={disableCopyPaste}
                                                    placeholder="••••••••"
                                                    className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-mono font-bold pl-11 pr-12 py-3 outline-none" />
                                                {eyeBtn("new")}
                                            </div>
                                            {passStrength && (
                                                <div className="flex flex-col gap-1.5 pt-1 animate-in fade-in">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-zinc-500">Strength:</span>
                                                        <span className={passStrength.text}>{passStrength.label}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${passStrength.width} ${passStrength.color} transition-all duration-300 rounded-full`} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Confirm New Password</label>
                                            <div className={`relative flex items-center bg-zinc-50 dark:bg-black/40 border rounded-xl focus-within:border-indigo-500 transition-all ${pwdForm.confirm.length > 0 && pwdForm.confirm !== pwdForm.new ? 'border-red-500 focus-within:border-red-500' : 'border-zinc-200 dark:border-white/10'}`}>
                                                <Key className="absolute left-4 h-4 w-4 text-zinc-400" />
                                                <input type={showPasswords.confirm ? "text" : "password"} value={pwdForm.confirm}
                                                    onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                                                    onCopy={disableCopyPaste} onPaste={disableCopyPaste} onCut={disableCopyPaste}
                                                    placeholder="••••••••"
                                                    className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-mono font-bold pl-11 pr-12 py-3 outline-none" />
                                                {eyeBtn("confirm")}
                                            </div>
                                            {pwdForm.confirm.length > 0 && pwdForm.confirm !== pwdForm.new && (
                                                <p className="text-[10px] text-red-500 font-bold pl-1">Passwords do not match</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Requirements Checklist */}
                                    <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-xl border border-zinc-100 dark:border-white/5 mt-2">
                                        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-zinc-500">
                                            {[
                                                { met: pwdForm.new.length >= 8, label: "8+ characters" },
                                                { met: /[A-Z]/.test(pwdForm.new), label: "Uppercase letter" },
                                                { met: /[0-9]/.test(pwdForm.new), label: "Number" },
                                                { met: /[^A-Za-z0-9]/.test(pwdForm.new), label: "Symbol" },
                                            ].map(({ met, label }) => (
                                                <div key={label} className={`flex items-center gap-2 transition-colors ${met ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                                    {met ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current opacity-30" />}
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="button" onClick={handleUpdatePassword} disabled={!isPwdValid || isUpdatingPwd}
                                        className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
                                        {isUpdatingPwd ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <Lock className="h-4 w-4 shrink-0" />}
                                        {isUpdatingPwd ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </div>

                            {/* B. 2FA */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-zinc-400" /> Two-Factor Auth (2FA)
                                    </div>
                                    {is2FAEnabled
                                        ? <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Enabled</span>
                                        : <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] flex items-center gap-1"><XCircle className="h-3 w-3" /> Disabled</span>
                                    }
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Authenticator App</p>
                                        <p className="text-xs font-medium text-zinc-500 mt-1 leading-snug">Use Google Authenticator to generate verification codes.</p>
                                    </div>
                                    <button type="button" onClick={() => setShow2FAModal(true)}
                                        className={`w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all outline-none active:scale-95 whitespace-nowrap shrink-0 ${is2FAEnabled ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/30'}`}>
                                        {is2FAEnabled ? "Reconfigure 2FA" : "Enable 2FA"}
                                    </button>
                                </div>
                            </div>

                            {/* C. Active Sessions */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <Monitor className="h-4 w-4 text-zinc-400" /> Active Sessions
                                    {otherSessions.length > 0 && (
                                        <span className="ml-auto px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-black">
                                            {otherSessions.length + 1} total
                                        </span>
                                    )}
                                </h3>

                                <div className="space-y-3">
                                    {/* Current session — always shown, cannot be revoked from here */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Monitor className="h-5 w-5 text-indigo-500 shrink-0" />
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                    Chrome on Windows <span className="text-indigo-500 ml-1 font-black">(Current)</span>
                                                </p>
                                                <p className="text-[10px] font-medium text-zinc-500 truncate">196.189.15.122 • Active Now</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">This device</span>
                                    </div>

                                    {/* Other sessions — disappear one-by-one when terminated */}
                                    {otherSessions.map(session => {
                                        const isRevoking = revokingId === session.id;
                                        return (
                                            <div
                                                key={session.id}
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 transition-all duration-500 ${isRevoking ? "opacity-40 scale-[0.98]" : "opacity-100"}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Smartphone className="h-5 w-5 text-zinc-400 shrink-0" />
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{session.device}</p>
                                                        <p className="text-[10px] font-medium text-zinc-500 truncate font-mono">{session.ip} • {session.ago}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeSession(session.id)}
                                                    disabled={isRevoking || terminateAllPhase === "terminating"}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors outline-none shrink-0 flex items-center gap-1 disabled:opacity-40"
                                                >
                                                    {isRevoking
                                                        ? <><RefreshCw className="h-3 w-3 animate-spin" /> Revoking…</>
                                                        : "Revoke"
                                                    }
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* All-clear state */}
                                    {otherSessions.length === 0 && terminateAllPhase !== "terminating" && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 animate-in fade-in duration-300">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                {terminateAllPhase === "done" ? "All other sessions terminated." : "No other active sessions."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Terminate All — three-phase button ──────────────────
                                    idle        → red button, normal
                                    confirming  → inline confirm/cancel pair
                                    terminating → spinner + progress text
                                    done        → handled by otherSessions.length === 0 above
                                ── */}
                                {terminateAllPhase === "idle" && otherSessions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleTerminateAllSessions}
                                        className="w-full py-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors outline-none"
                                    >
                                        Terminate All Other Sessions
                                    </button>
                                )}

                                {terminateAllPhase === "confirming" && (
                                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                                        <p className="text-[10px] font-bold text-zinc-500 text-center uppercase tracking-widest">
                                            Sign out <span className="text-red-500">{otherSessions.length} other device{otherSessions.length !== 1 ? "s" : ""}</span>? This cannot be undone.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={cancelTerminateAll}
                                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors outline-none"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleTerminateAllSessions}
                                                className="flex-[2] py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95"
                                            >
                                                Yes, Terminate All
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {terminateAllPhase === "terminating" && (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center gap-2 outline-none cursor-not-allowed"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        Terminating sessions…
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full xl:w-[450px] flex flex-col gap-6 shrink-0">

                    {/* 5. SYSTEM ACCESS LOG */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col flex-1 overflow-hidden">
                        <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500" /> System Access Log
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Recent Admin Activity</p>
                        </div>
                        <div className="overflow-x-auto w-full custom-scrollbar flex-1 max-h-[400px] xl:max-h-none">
                            <table className="w-full text-left min-w-[400px]">
                                <thead className="bg-zinc-50 dark:bg-[#18181b] uppercase text-[9px] font-black tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-white/5 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp / Action</th>
                                        <th className="px-4 py-3 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {MOCK_ACCESS_LOG.map((log) => (
                                        <tr key={log.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 min-w-0 pr-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {log.status === "Success"
                                                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{log.action}</span>
                                                </div>
                                                <p className="text-[10px] font-mono font-medium text-zinc-500 pl-5 truncate">{log.time}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right shrink-0">
                                                <p className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">{log.ip}</p>
                                                <p className="text-[10px] text-zinc-500 mt-0.5">{log.device}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 6. DANGER ZONE */}
                    <div className="bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-red-500/30 overflow-hidden flex flex-col shrink-0">
                        <div className="p-5 border-b border-red-500/20 bg-red-500/5 shrink-0">
                            <h2 className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 shrink-0" /> Danger Zone
                            </h2>
                            <p className="text-[10px] font-bold text-red-600/70 dark:text-red-500/70 uppercase tracking-widest mt-1">Destructive & Sensitive Actions</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 transition-colors">
                                <div className="min-w-0 pr-2">
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">Export Admin Data</h4>
                                    <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-tight">Download a JSON copy of your activity.</p>
                                </div>
                                <button type="button" onClick={handleExportData} disabled={isExporting}
                                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors outline-none active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">
                                    {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                    {isExporting ? "Exporting..." : "Export"}
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5">
                                <div className="min-w-0 pr-2">
                                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400 truncate">Factory Reset Account</h4>
                                    <p className="text-[10px] font-medium text-red-600/80 dark:text-red-400/80 mt-1 leading-tight">Wipe profile data and disable 2FA.</p>
                                </div>
                                <button type="button" onClick={() => setShowResetModal(true)}
                                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 shrink-0">
                                    <Trash2 className="h-3.5 w-3.5" /> Reset Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CAMERA MODAL ── */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#18181b] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
                            <h2 className="text-lg font-bold text-white drop-shadow-md">Take Profile Photo</h2>
                            <button type="button" onClick={stopCamera} className="p-2 text-white hover:text-red-400 transition-colors outline-none"><X className="h-6 w-6" /></button>
                        </div>
                        <div className="relative w-full aspect-square bg-black overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                            <div className="absolute inset-0 border-[6px] border-indigo-500/30 rounded-full m-8 pointer-events-none" />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="p-6 bg-[#18181b] flex items-center justify-center border-t border-white/10">
                            <button type="button" onClick={capturePhoto} className="h-16 w-16 bg-white rounded-full border-4 border-zinc-400 hover:border-indigo-500 hover:bg-zinc-100 transition-all flex items-center justify-center outline-none active:scale-95">
                                <div className="h-12 w-12 bg-indigo-500 rounded-full" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2FA MODAL ── */}
            {show2FAModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-900/90 dark:bg-black/95 backdrop-blur-md" onClick={() => !isVerifying2FA && close2FAModal()} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-black text-zinc-900 dark:text-white truncate">Enable 2FA</h2>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Secure your account</p>
                                </div>
                            </div>
                            <button type="button" onClick={close2FAModal} disabled={isVerifying2FA} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors outline-none disabled:opacity-50"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            {twoFAStep === 1 && (
                                <div className="flex flex-col items-center text-center">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-200 mb-4">
                                        <div className="w-32 h-32 bg-zinc-100 flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300">
                                            <QrCode className="h-12 w-12 text-zinc-400 opacity-50" />
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-2">Scan QR Code</h3>
                                    <p className="text-xs font-medium text-zinc-500 mb-6">Open Google Authenticator or Authy and scan the image above to add your account.</p>
                                    <div className="w-full space-y-1.5 mb-6 text-left">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Or enter manual key</label>
                                        <div className="flex bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white justify-between items-center select-all">
                                            JBSWY3DPEHPK3PXP
                                            <Copy className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-indigo-500 shrink-0 ml-2" />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setTwoFAStep(2)} className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2">
                                        Next: Verify Code <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {twoFAStep === 2 && (
                                <div className="flex flex-col items-center text-center h-full">
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-2">Enter Verification Code</h3>
                                    <p className="text-xs font-medium text-zinc-500 mb-8">Type the 6-digit code from your authenticator app. <span className="text-indigo-500 font-bold">(Hint: 123456)</span></p>
                                    <input type="text" maxLength={6} value={twoFACode}
                                        onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000" autoFocus
                                        className="w-full max-w-[200px] bg-zinc-50 dark:bg-black/40 border-2 border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-4 text-3xl font-mono font-black text-center text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-all tracking-[0.25em]" />
                                    <div className="flex w-full gap-3 mt-auto pt-8">
                                        <button type="button" onClick={() => setTwoFAStep(1)} disabled={isVerifying2FA} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95 disabled:opacity-50">Back</button>
                                        <button type="button" onClick={handleVerify2FA} disabled={twoFACode.length !== 6 || isVerifying2FA} className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
                                            {isVerifying2FA ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                                            {isVerifying2FA ? "Verifying..." : "Verify & Enable"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {twoFAStep === 3 && (
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
                                        <CheckCircle className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">2FA Enabled</h3>
                                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8">Your admin account is now protected with Two-Factor Authentication.</p>
                                    <button type="button" onClick={close2FAModal} className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 outline-none active:scale-95 transition-all">Done</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── FACTORY RESET MODAL ── */}
            {showResetModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isResetting && setShowResetModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-red-200 dark:border-red-500/30 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mb-6">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3">Reset Admin Account?</h2>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            This will wipe your customised profile data and instantly disable Two-Factor Authentication. <strong className="text-red-600 dark:text-red-400">This action is irreversible.</strong>
                        </p>

                        <div className="w-full space-y-4 text-left mb-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type "RESET" to confirm</label>
                                <input type="text" value={resetForm.confirmText}
                                    onChange={e => setResetForm({ ...resetForm, confirmText: e.target.value.toUpperCase() })}
                                    placeholder="RESET"
                                    className={`w-full bg-zinc-50 dark:bg-black/40 border rounded-xl px-4 py-3 text-sm font-mono font-black text-center outline-none transition-colors uppercase ${resetForm.confirmText.length > 0
                                        ? resetForm.confirmText === 'RESET' ? 'border-red-500 text-red-600 focus:border-red-600' : 'border-amber-500 text-amber-600'
                                        : 'border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:border-red-500'
                                        }`} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Password</label>
                                <div className="relative flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl focus-within:border-red-500 transition-all">
                                    <Key className="absolute left-4 h-4 w-4 text-zinc-400" />
                                    <input type={showPasswords.current ? "text" : "password"} value={resetForm.password}
                                        onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent px-4 py-3 text-sm font-mono font-bold text-zinc-900 dark:text-white outline-none pl-11 pr-12" />
                                    {eyeBtn("current")}
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full gap-3">
                            <button type="button" onClick={() => setShowResetModal(false)} disabled={isResetting} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none active:scale-95">Cancel</button>
                            <button type="button" onClick={handleResetAccount} disabled={!isResetValid || isResetting} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all outline-none active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
                                {isResetting ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <Trash2 className="h-4 w-4 shrink-0" />}
                                {isResetting ? "Resetting..." : "Wipe Account"}
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