import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Mail, Lock, AlertCircle, Loader2,
    Eye, EyeOff, ShieldAlert, ArrowLeft,
    KeyRound, CheckCircle2, User, ShieldCheck
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { AdminHeader } from "../../../components/layout/AdminHeader";

// ─── FLOW MODES ───────────────────────────────────────────────────────────────
// "login"        → normal sign in form
// "fp-identity"  → forgot: email + admin ID verification
// "fp-otp"       → forgot: 6-digit OTP
// "fp-password"  → forgot: new password
// "fp-success"   → forgot: success screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminLogin() {
    const { setTheme } = useTheme();
    const navigate = useNavigate();

    // --- FLOW ---
    const [mode, setMode] = useState("login");

    // --- LOGIN STATE ---
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);

    // --- FORGOT STATE ---
    const [fpEmail, setFpEmail] = useState("");
    const [fpAdminId, setFpAdminId] = useState("");
    const [fpOtp, setFpOtp] = useState("");
    const [fpPassword, setFpPassword] = useState("");
    const [fpRepeat, setFpRepeat] = useState("");
    const [showFpPassword, setShowFpPassword] = useState(false);
    const [showFpRepeat, setShowFpRepeat] = useState(false);
    const [fpEmailError, setFpEmailError] = useState("");
    const [fpPasswordError, setFpPasswordError] = useState("");
    const [fpError, setFpError] = useState(null);
    const [fpLoading, setFpLoading] = useState(false);

    // --- LOGIN EMAIL VALIDATION ---
    const [loginEmailError, setLoginEmailError] = useState("");

    // Always use the browser's system preference on the admin login page.
    // Ignores any saved vp_theme so the admin always gets a clean, predictable experience.
    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
    }, [setTheme]);

    // Smart email validator — reusable for both flows
    const validateEmail = (email, setError) => {
        const mail = email.trim();
        if (mail.length === 0) { setError(""); return; }
        if (!mail.includes("@")) { setError("Please include an '@'."); return; }
        const parts = mail.split("@");
        if (parts[0].length === 0) { setError("Enter the part before '@'."); return; }
        if (!parts[1] || parts[1].length === 0) { setError("Enter a domain after '@'."); return; }
        if (!parts[1].includes(".")) { setError(`Complete the domain (e.g., ${parts[1]}.com).`); return; }
        const tld = parts[1].split(".").pop();
        if (tld.length < 2) { setError("Domain extension too short."); return; }
        const typos = {
            "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gmail.co": "gmail.com",
            "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "yhoo.com": "yahoo.com",
        };
        if (typos[parts[1].toLowerCase()]) { setError(`Did you mean @${typos[parts[1].toLowerCase()]}?`); return; }
        setError("");
    };

    useEffect(() => { validateEmail(loginEmail, setLoginEmailError); }, [loginEmail]);
    useEffect(() => { validateEmail(fpEmail, setFpEmailError); }, [fpEmail]);

    // Password strength
    const getPasswordScore = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/\d/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        if (pass.length >= 12) score++;
        return Math.min(score, 5);
    };
    const fpScore = getPasswordScore(fpPassword);
    const isFpStrong = fpScore >= 4;
    const getStrengthUI = (score) => {
        if (score === 0) return { text: "", color: "bg-transparent", textColor: "" };
        if (score <= 2) return { text: "Weak", color: "bg-red-500", textColor: "text-red-500" };
        if (score === 3) return { text: "Fair", color: "bg-amber-500", textColor: "text-amber-500" };
        if (score === 4) return { text: "Good", color: "bg-indigo-500", textColor: "text-indigo-500" };
        return { text: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" };
    };
    const strengthUI = getStrengthUI(fpScore);

    useEffect(() => {
        if (fpRepeat && fpPassword !== fpRepeat) setFpPasswordError("Passwords do not match");
        else setFpPasswordError("");
    }, [fpPassword, fpRepeat]);

    const resetFpState = () => {
        setFpEmail(""); setFpAdminId(""); setFpOtp("");
        setFpPassword(""); setFpRepeat(""); setFpError(null);
        setFpEmailError(""); setFpPasswordError("");
    };

    const goToLogin = () => { resetFpState(); setMode("login"); };

    // --- HANDLERS ---
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginEmail || loginEmailError || !loginPassword) return;
        setLoginError(null);
        setLoginLoading(true);
        try {
            // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
            // const { token } = await api.post('/admin/auth/login', { email: loginEmail, password: loginPassword });
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (loginPassword === "wrong") reject(new Error());
                    else resolve();
                }, 1500);
            });
            navigate("/admin/dashboard");
        } catch {
            setLoginError("Invalid credentials. Please check your details and try again.");
            setLoginLoading(false);
        }
    };

    const handleFpIdentity = (e) => {
        e.preventDefault();
        if (fpEmailError || !fpEmail || !fpAdminId) return;
        setFpError(null);
        setFpLoading(true);
        // 🛑 TEAMS: REPLACE — backend checks BOTH fields simultaneously 🛑
        // Returns same vague response whether email, ID, or both are wrong
        setTimeout(() => {
            setFpLoading(false);
            setMode("fp-otp");
        }, 1500);
    };

    const handleFpOtp = (e) => {
        e.preventDefault();
        if (fpOtp.length !== 6) { setFpError("Please enter a valid 6-digit code."); return; }
        setFpError(null);
        setFpLoading(true);
        // 🛑 TEAMS: REPLACE — OTP expires in 30 minutes 🛑
        setTimeout(() => {
            setFpLoading(false);
            if (fpOtp === "000000") setFpError("Invalid or expired code. Codes expire in 30 minutes.");
            else setMode("fp-password");
        }, 1200);
    };

    const handleFpReset = async (e) => {
        e.preventDefault();
        if (!isFpStrong || fpPasswordError) return;
        setFpError(null);
        setFpLoading(true);
        try {
            // 🛑 TEAMS: REPLACE — backend must invalidate ALL active admin sessions 🛑
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (fpPassword === "error123!") reject(new Error());
                    else resolve();
                }, 2000);
            });
            setFpLoading(false);
            setMode("fp-success");
        } catch {
            setFpLoading(false);
            setFpError("Failed to update password. The reset code may have expired.");
        }
    };

    // --- SHARED STYLES ---
    const inputBase = `block w-full h-12 md:h-14 rounded-xl text-sm md:text-base transition-all duration-300 outline-none
        bg-white/50 border text-zinc-900 placeholder:text-zinc-400
        dark:bg-black/40 dark:text-white dark:placeholder:text-zinc-600`;
    const inputNormal = `border-zinc-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40
        focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] focus:bg-white/80 dark:focus:bg-black/60`;
    const inputError = `border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]`;

    const primaryBtn = `group relative w-full h-12 md:h-14 mt-2 flex items-center justify-center rounded-xl
        bg-indigo-600 text-white font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden
        transition-all duration-300 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95
        disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed
        shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]
        outline-none cursor-pointer`;

    const errorBanner = (msg) => msg ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm leading-relaxed">{msg}</p>
        </div>
    ) : null;

    const backBtn = (label, onClick) => (
        <div className="mt-5 text-center text-xs md:text-sm">
            <button type="button" onClick={onClick}
                className="flex items-center justify-center gap-1.5 mx-auto text-zinc-500 dark:text-zinc-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-400 transition-all outline-none cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> {label}
            </button>
        </div>
    );

    return (
        <div className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f4f4f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col items-center justify-center px-4 py-10">
            <AdminHeader />

            {/* Ambient glows */}
            <div className="fixed w-[50vw] h-[50vw] top-[-10%] left-[-10%] pointer-events-none z-0 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="fixed w-[40vw] h-[40vw] bottom-[-10%] right-[-10%] pointer-events-none z-0 rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500 pt-20 pb-6">

                {/* ── Title block — hidden on success screen ── */}
                {mode !== "fp-success" && (
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <ShieldAlert className="h-4 w-4 text-indigo-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                                System Administrator
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {mode === "login" ? "Admin Sign In"
                                : mode === "fp-identity" ? "Reset Password"
                                    : mode === "fp-otp" ? "Check Your Email"
                                        : "Create New Password"}
                        </h1>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2">
                            {mode === "login" ? "Restricted access. Authorized personnel only."
                                : mode === "fp-identity" ? "Both your registered email and Admin ID are required."
                                    : mode === "fp-otp" ? `A 6-digit code was sent to ${fpEmail}. Expires in 30 minutes.`
                                        : "Identity confirmed. All active sessions will be signed out."}
                        </p>
                    </div>
                )}

                {/* ── Card ── */}
                <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl p-6 md:p-8">

                    {/* ════════════════════════════════════════
                        MODE: LOGIN
                    ════════════════════════════════════════ */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                            {errorBanner(loginError)}

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1 flex justify-between">
                                    Email Address
                                    {loginEmailError && <span className="text-red-500 text-[10px] mt-0.5 normal-case tracking-normal">{loginEmailError}</span>}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="admin@visionpark.et" required disabled={loginLoading}
                                        className={`${inputBase} pl-12 pr-4 ${loginEmailError ? inputError : inputNormal}`} />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type={showLoginPassword ? "text" : "password"}
                                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Enter your password" required disabled={loginLoading}
                                        autoComplete="current-password"
                                        className={`${inputBase} pl-12 pr-12 ${inputNormal}`} />
                                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                                        {showLoginPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                {/* Forgot password — triggers mode switch, NOT a route */}
                                <div className="flex justify-end mt-1">
                                    <button type="button" onClick={() => { setLoginError(null); setMode("fp-identity"); }}
                                        className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors outline-none cursor-pointer">
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loginLoading || !loginEmail || !!loginEmailError || !loginPassword} className={primaryBtn}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                            </button>

                            {/* Security notice */}
                            <div className="mt-2 flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                                <p className="text-[10px] md:text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                    This portal is restricted to system administrators. All access attempts are logged.
                                </p>
                            </div>
                        </form>
                    )}

                    {/* ════════════════════════════════════════
                        MODE: FORGOT — STEP 1 (Identity)
                    ════════════════════════════════════════ */}
                    {mode === "fp-identity" && (
                        <form onSubmit={handleFpIdentity} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            {errorBanner(fpError)}

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1 flex justify-between">
                                    Registered Email
                                    {fpEmailError && <span className="text-red-500 text-[10px] mt-0.5 normal-case tracking-normal">{fpEmailError}</span>}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)}
                                        placeholder="admin@visionpark.et" required disabled={fpLoading}
                                        className={`${inputBase} pl-12 pr-4 ${fpEmailError ? inputError : inputNormal}`} />
                                </div>
                            </div>

                            {/* Admin ID */}
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                                    System Admin ID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <User className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type="text" value={fpAdminId} onChange={(e) => setFpAdminId(e.target.value)}
                                        placeholder="e.g. VP-ADMIN-01" required disabled={fpLoading}
                                        className={`${inputBase} pl-12 pr-4 ${inputNormal}`} />
                                </div>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 ml-1">
                                    The username assigned when your account was created.
                                </p>
                            </div>

                            {/* Security notice */}
                            <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                                <p className="text-[10px] md:text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                    For security, no feedback is given if either field is incorrect.
                                </p>
                            </div>

                            <button type="submit" disabled={fpLoading || !fpEmail || !!fpEmailError || !fpAdminId} className={primaryBtn}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {fpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Send Code"}
                            </button>

                            {backBtn("Back to Sign In", goToLogin)}
                        </form>
                    )}

                    {/* ════════════════════════════════════════
                        MODE: FORGOT — STEP 2 (OTP)
                    ════════════════════════════════════════ */}
                    {mode === "fp-otp" && (
                        <form onSubmit={handleFpOtp} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            {errorBanner(fpError)}

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
                                    6-Digit Security Code
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type="text" maxLength={6} value={fpOtp}
                                        onChange={(e) => setFpOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="000000" required disabled={fpLoading}
                                        className={`block w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-lg md:text-xl font-bold tracking-[0.5em] text-center transition-all duration-300 outline-none
                                            bg-white/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal
                                            dark:bg-black/40 dark:border-white/10 dark:text-indigo-400 dark:placeholder:text-zinc-700
                                            hover:border-indigo-300 dark:hover:border-indigo-500/40 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]`} />
                                </div>
                            </div>

                            <button type="submit" disabled={fpLoading || fpOtp.length !== 6} className={primaryBtn}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {fpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                            </button>

                            <div className="mt-2 text-center text-xs md:text-sm text-zinc-500 dark:text-zinc-400 flex flex-col gap-3">
                                <p>Didn't receive the code?{" "}
                                    <button type="button" onClick={() => { setFpOtp(""); setFpError(null); }}
                                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline outline-none cursor-pointer">
                                        Resend
                                    </button>
                                </p>
                                <div className="flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => { setMode("fp-identity"); setFpError(null); setFpOtp(""); }}
                                        className="flex items-center gap-1.5 font-medium hover:text-indigo-500 dark:hover:text-indigo-400 transition-all outline-none cursor-pointer">
                                        <ArrowLeft className="h-4 w-4" /> Change Details
                                    </button>
                                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
                                    <button type="button" onClick={goToLogin}
                                        className="font-medium hover:text-indigo-500 dark:hover:text-indigo-400 transition-all outline-none cursor-pointer">
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* ════════════════════════════════════════
                        MODE: FORGOT — STEP 3 (New Password)
                    ════════════════════════════════════════ */}
                    {mode === "fp-password" && (
                        <form onSubmit={handleFpReset} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {errorBanner(fpError)}

                            <div className="flex justify-center mb-2">
                                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                    <KeyRound className="h-6 w-6 text-indigo-500" />
                                </div>
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type={showFpPassword ? "text" : "password"} value={fpPassword}
                                        onChange={(e) => setFpPassword(e.target.value)} required
                                        placeholder="Create new password" autoComplete="new-password"
                                        onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                                        onCut={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}
                                        className={`${inputBase} pl-12 pr-12 font-mono ${inputNormal}`} />
                                    <button type="button" onClick={() => setShowFpPassword(!showFpPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                                        {showFpPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                {fpPassword && (
                                    <div className="mt-2 animate-in fade-in duration-300">
                                        <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10">
                                            {[1, 2, 3, 4, 5].map(level => (
                                                <div key={level} className={`flex-1 transition-colors duration-300 ${fpScore >= level ? strengthUI.color : "bg-transparent"}`} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">8+ chars, upper, lower, num, symbol</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthUI.textColor}`}>{strengthUI.text}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 flex justify-between">
                                    Repeat Password
                                    {fpPasswordError && <span className="text-red-500 text-[10px] mt-0.5">{fpPasswordError}</span>}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input type={showFpRepeat ? "text" : "password"} value={fpRepeat}
                                        onChange={(e) => setFpRepeat(e.target.value)} required
                                        placeholder="Confirm new password" autoComplete="new-password"
                                        onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}
                                        onCut={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}
                                        className={`${inputBase} pl-12 pr-12 font-mono ${fpPasswordError ? inputError : inputNormal}`} />
                                    <button type="button" onClick={() => setShowFpRepeat(!showFpRepeat)}
                                        className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                                        {showFpRepeat ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Session kill warning */}
                            <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                                <p className="text-[10px] md:text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                    Saving will immediately sign out all active admin sessions on every device.
                                </p>
                            </div>

                            <button type="submit" disabled={fpLoading || !isFpStrong || !!fpPasswordError} className={`${primaryBtn} mt-2`}>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {fpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                            </button>

                            {backBtn("Cancel & Back to Sign In", goToLogin)}
                        </form>
                    )}

                    {/* ════════════════════════════════════════
                        MODE: FORGOT — STEP 4 (Success)
                    ════════════════════════════════════════ */}
                    {mode === "fp-success" && (
                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 py-4">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-6">
                                <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Password Updated!</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 px-2">
                                Your admin password has been successfully changed.
                            </p>
                            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-8 text-left w-full">
                                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                <p className="text-[10px] md:text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                    All previous admin sessions have been signed out. Please sign in with your new credentials.
                                </p>
                            </div>
                            <button onClick={goToLogin}
                                className="group relative w-full h-12 md:h-14 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)] outline-none cursor-pointer">
                                Back to Sign In
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}