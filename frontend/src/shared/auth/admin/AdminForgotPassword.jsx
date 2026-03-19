import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Mail, Lock, AlertCircle, Loader2, ArrowLeft,
    KeyRound, Eye, EyeOff, ShieldCheck, User, ShieldAlert
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

export default function AdminForgotPassword() {
    const { setTheme } = useTheme();
    const navigate = useNavigate();

    // --- Flow State ---
    // Step 1: Dual Identity Verification (Email + Admin ID)
    // Step 2: OTP
    // Step 3: New Password
    // Step 4: Success
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Form Data ---
    const [email, setEmail] = useState("");
    const [adminId, setAdminId] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    // --- Validation Errors ---
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    // Theme check
    useEffect(() => {
        const savedTheme = localStorage.getItem("vp_theme");
        if (!savedTheme) setTheme("light");
        else setTheme(savedTheme);
    }, [setTheme]);

    // --- 1. SMART EMAIL VALIDATION ---
    useEffect(() => {
        if (step !== 1) return;
        const mail = email.trim();
        if (mail.length > 0) {
            if (!mail.includes("@")) { setEmailError("Please include an '@'."); return; }
            const parts = mail.split("@");
            if (parts[0].length === 0) { setEmailError("Enter the part before the '@'."); return; }
            if (!parts[1] || parts[1].length === 0) { setEmailError("Enter a domain after the '@'."); return; }
            if (!parts[1].includes(".")) { setEmailError(`Complete the domain (e.g., ${parts[1]}.com).`); return; }
            const tld = parts[1].split(".").pop();
            if (tld.length < 2) { setEmailError("Domain extension is too short."); return; }
            const typos = {
                "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gmail.co": "gmail.com",
                "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "yhoo.com": "yahoo.com",
            };
            if (typos[parts[1].toLowerCase()]) {
                setEmailError(`Did you mean @${typos[parts[1].toLowerCase()]}?`);
                return;
            }
            setEmailError("");
        } else {
            setEmailError("");
        }
    }, [email, step]);

    // --- 2. PASSWORD VALIDATION ---
    const getPasswordScore = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/\d/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        if (pass.length >= 12) score += 1;
        return Math.min(score, 5);
    };
    const passwordScore = getPasswordScore(password);
    const isPasswordStrong = passwordScore >= 4;

    const getStrengthUI = (score) => {
        if (score === 0) return { text: "", color: "bg-transparent", textColor: "" };
        if (score <= 2) return { text: "Weak", color: "bg-red-500", textColor: "text-red-500" };
        if (score === 3) return { text: "Fair", color: "bg-amber-500", textColor: "text-amber-500" };
        if (score === 4) return { text: "Good", color: "bg-blue-500", textColor: "text-blue-500" };
        return { text: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" };
    };
    const strengthData = getStrengthUI(passwordScore);

    useEffect(() => {
        if (repeatPassword && password !== repeatPassword) {
            setPasswordError("Passwords do not match");
        } else {
            setPasswordError("");
        }
    }, [password, repeatPassword]);

    // Both email AND adminId must be filled and valid
    const isStep1Valid = email.trim().length > 0 && !emailError && adminId.trim().length > 0;

    // --- HANDLERS ---
    const handleVerifyIdentity = (e) => {
        e.preventDefault();
        if (!isStep1Valid) return;
        setError(null);
        setIsLoading(true);
        // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
        // await api.post('/admin/auth/forgot-password/verify', { email, adminId });
        // Backend checks BOTH fields simultaneously. Returns same vague response whether
        // email, ID, or both are wrong — prevents probing attacks.
        setTimeout(() => {
            setIsLoading(false);
            if (adminId.trim().toUpperCase() === "WRONG") {
                setError("If the details match a registered admin account, a reset code has been sent.");
            } else {
                setStep(2);
            }
        }, 1500);
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otp.length !== 6) { setError("Please enter a valid 6-digit code."); return; }
        setError(null);
        setIsLoading(true);
        // 🛑 TEAMS: Admin OTP expires in 30 minutes (shorter than consumer flows) 🛑
        setTimeout(() => {
            setIsLoading(false);
            if (otp === "000000") {
                setError("Invalid or expired code. Admin reset codes expire in 30 minutes.");
            } else {
                setStep(3);
            }
        }, 1200);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!isPasswordStrong || passwordError) return;
        setError(null);
        setIsLoading(true);
        try {
            // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
            // await api.post('/admin/auth/reset-password', { email, adminId, otp, password });
            // CRITICAL: Backend MUST invalidate ALL active admin sessions after successful reset.
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (password === "error123!") reject(new Error("Simulated Backend Error"));
                    else resolve();
                }, 2000);
            });
            setIsLoading(false);
            setStep(4);
        } catch (err) {
            setIsLoading(false);
            setError("Failed to update password. The reset code may have expired or a server error occurred.");
        }
    };

    // --- SHARED STYLES ---
    const getInputClass = (hasError) =>
        `block w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-sm md:text-base transition-all duration-300 outline-none
    bg-white/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400
    dark:bg-black/40 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-600
    ${hasError
            ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : "hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60"
        }`;

    const primaryBtn = `group relative w-full h-12 md:h-14 mt-2 flex items-center justify-center rounded-xl bg-emerald-500
    text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300
    hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100
    disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
    outline-none cursor-pointer`;

    return (
        <div className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f4f4f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col items-center justify-center px-4 py-10">

            <div className="ambient-glow-primary fixed w-[50vw] h-[50vw] top-[-10%] left-[-10%] pointer-events-none z-0" />
            <div className="ambient-glow-secondary fixed w-[40vw] h-[40vw] bottom-[-10%] right-[-10%] pointer-events-none z-0" />

            <main className="w-full relative z-10">
                <div className="w-full max-w-[420px] m-auto animate-in fade-in zoom-in-95 duration-500">

                    {step !== 4 && (
                        <div className="text-center mb-8">
                            {/* Admin role badge — visually signals this is a privileged reset flow */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                                    System Administrator
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm">
                                {step === 1 ? "Reset Admin Password"
                                    : step === 2 ? "Check Your Email"
                                        : "Create New Password"}
                            </h1>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-2">
                                {step === 1
                                    ? "Both your registered email and System Admin ID are required."
                                    : step === 2
                                        ? `A 6-digit code was sent to ${email}. It expires in 30 minutes.`
                                        : "Identity confirmed. All active sessions will be signed out on save."}
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl p-6 md:p-8">
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <p className="text-xs md:text-sm leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* ── STEP 1: DUAL IDENTITY VERIFICATION ── */}
                        {step === 1 && (
                            <form onSubmit={handleVerifyIdentity} className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1 flex justify-between">
                                        Registered Email
                                        {emailError && (
                                            <span className="text-red-500 text-[10px] mt-0.5 normal-case tracking-normal">{emailError}</span>
                                        )}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Mail className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@visionpark.et"
                                            required
                                            disabled={isLoading}
                                            className={getInputClass(!!emailError)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                                        System Admin ID
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <User className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                                        </div>
                                        <input
                                            type="text"
                                            value={adminId}
                                            onChange={(e) => setAdminId(e.target.value)}
                                            placeholder="e.g. VP-ADMIN-01"
                                            required
                                            disabled={isLoading}
                                            className={getInputClass(false)}
                                        />
                                    </div>
                                    <p className="text-[10px] md:text-[11px] text-zinc-400 dark:text-zinc-600 ml-1">
                                        This is the username assigned when your account was created.
                                    </p>
                                </div>

                                {/* Security notice — unique to admin flow */}
                                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                                    <p className="text-[10px] md:text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                        For security, no feedback is given if either field is incorrect. If you've lost access to your registered email, contact your system developer.
                                    </p>
                                </div>

                                <button type="submit" disabled={isLoading || !isStep1Valid} className={primaryBtn}>
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Send Code"}
                                </button>

                                <div className="mt-4 text-center text-xs md:text-sm">
                                    <Link to="/admin/login" className="flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                                        <ArrowLeft className="h-4 w-4" /> Back to Admin Sign In
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* ── STEP 2: OTP ── */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                                        6-Digit Security Code
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <KeyRound className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                            placeholder="000000"
                                            required
                                            disabled={isLoading}
                                            className="block w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-lg md:text-xl font-bold tracking-[0.5em] text-center transition-all duration-300 outline-none
                        bg-white/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal
                        dark:bg-black/40 dark:border-white/10 dark:text-emerald-400 dark:placeholder:text-zinc-700
                        hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60"
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading || otp.length !== 6} className={primaryBtn}>
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                                </button>

                                <div className="mt-4 text-center text-xs md:text-sm text-zinc-600 dark:text-zinc-400 flex flex-col gap-4">
                                    <p>
                                        Didn't receive the code?{" "}
                                        <button type="button" onClick={() => { setOtp(""); setError(null); }} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline outline-none cursor-pointer">
                                            Resend
                                        </button>
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        <button type="button" onClick={() => { setStep(1); setError(null); setOtp(""); }} className="flex items-center justify-center gap-1.5 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none cursor-pointer">
                                            <ArrowLeft className="h-4 w-4" /> Change Details
                                        </button>
                                        <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
                                        <Link to="/admin/login" className="font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                                            Sign In
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* ── STEP 3: NEW PASSWORD ── */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-center mb-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <KeyRound className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="Create new password"
                                            autoComplete="new-password"
                                            onCopy={(e) => e.preventDefault()}
                                            onPaste={(e) => e.preventDefault()}
                                            onCut={(e) => e.preventDefault()}
                                            onDrop={(e) => e.preventDefault()}
                                            className="block w-full h-12 md:h-14 pl-12 pr-12 rounded-xl text-sm md:text-base font-mono transition-all duration-300 outline-none border bg-white/50 dark:bg-black/40 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                                            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="mt-2 animate-in fade-in duration-300">
                                            <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div key={level} className={`flex-1 transition-colors duration-300 ${passwordScore >= level ? strengthData.color : "bg-transparent"}`} />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-1.5">
                                                <span className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400">8+ chars, upper, lower, num, symbol</span>
                                                <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${strengthData.textColor}`}>{strengthData.text}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 flex justify-between">
                                        Repeat Password
                                        {passwordError && <span className="text-red-500 text-[10px] mt-0.5">{passwordError}</span>}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                                        </div>
                                        <input
                                            type={showRepeatPassword ? "text" : "password"}
                                            value={repeatPassword}
                                            onChange={(e) => setRepeatPassword(e.target.value)}
                                            required
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            onCopy={(e) => e.preventDefault()}
                                            onPaste={(e) => e.preventDefault()}
                                            onCut={(e) => e.preventDefault()}
                                            onDrop={(e) => e.preventDefault()}
                                            className={`block w-full h-12 md:h-14 pl-12 pr-12 rounded-xl text-sm md:text-base font-mono transition-all duration-300 outline-none border bg-white/50 dark:bg-black/40 text-zinc-900 dark:text-white
                        ${passwordError
                                                    ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                    : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60"
                                                }`}
                                        />
                                        <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                                            {showRepeatPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Session kill warning — admin-specific, not shown to Driver/Owner */}
                                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                                    <p className="text-[10px] md:text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                        Saving a new password will immediately sign out all active admin sessions on every device.
                                    </p>
                                </div>

                                <button type="submit" disabled={isLoading || !isPasswordStrong || !!passwordError} className={`${primaryBtn} mt-4`}>
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                                </button>

                                <div className="mt-4 text-center text-xs md:text-sm">
                                    <Link to="/admin/login" className="flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                                        <ArrowLeft className="h-4 w-4" /> Cancel & Back to Sign In
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* ── STEP 4: SUCCESS ── */}
                        {step === 4 && (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 py-4">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-6">
                                    <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Password Updated!</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 px-2">
                                    Your admin password has been successfully changed.
                                </p>
                                {/* Session invalidation confirmation — admin-specific detail */}
                                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-8 text-left">
                                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                    <p className="text-[10px] md:text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                        All previous admin sessions have been signed out. Please sign in again with your new credentials.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/admin/login")}
                                    className="group relative w-full h-12 md:h-14 flex items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none cursor-pointer"
                                >
                                    Go to Admin Sign In
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}