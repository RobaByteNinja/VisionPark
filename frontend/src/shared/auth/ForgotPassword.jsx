import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Header } from "../../components/layout/Header";
import { useTheme } from "../../context/ThemeContext";

export default function ForgotPassword() {
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  // --- Flow State ---
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Form Data ---
  const [email, setEmail] = useState("");
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
      if (!mail.includes('@')) { setEmailError("Please include an '@'."); return; }
      const parts = mail.split('@');
      if (parts[0].length === 0) { setEmailError("Enter the part before the '@'."); return; }
      if (!parts[1] || parts[1].length === 0) { setEmailError("Enter a domain after the '@'."); return; }
      if (!parts[1].includes('.')) { setEmailError(`Complete the domain extension (e.g., ${parts[1]}.com).`); return; }
      
      const tld = parts[1].split('.').pop();
      if (tld.length < 2) { setEmailError("Domain extension is too short."); return; }
      
      const typos = {
        'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.co': 'gmail.com',
        'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yhoo.com': 'yahoo.com'
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


  // --- HANDLERS ---
  const handleSendOTP = (e) => {
    e.preventDefault();
    if (emailError || !email) return;
    setError(null);
    setIsLoading(true);
    
    // Simulate API call to send OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    // Simulate OTP Verification
    setTimeout(() => {
      setIsLoading(false);
      if (otp === "000000") {
        setError("Invalid OTP code. Try again.");
      } else {
        setStep(3); // Move to set password
      }
    }, 1200);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong || passwordError) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      // 🛑 TEAMS: REPLACE THIS TIMEOUT WITH ACTUAL API CALL 🛑
      // Example: await api.post('/auth/reset-password', { email, otp, password });
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate a random backend failure if password is "error123!" for testing UI
          if (password === "error123!") reject(new Error("Simulated Backend Error"));
          else resolve();
        }, 2000);
      });

      // ✅ SUCCESS STATE: Transition to Step 4
      setIsLoading(false);
      setStep(4);

    } catch (err) {
      // ❌ FAIL STATE: Show error message, stay on Step 3
      setIsLoading(false);
      setError("Failed to update password. The link may have expired or a server error occurred.");
    }
  };

  const getInputClass = (hasError) => `block w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-sm md:text-base transition-all duration-300 outline-none
    bg-white/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400
    dark:bg-black/40 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-600
    ${hasError ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
               : 'hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60'}
  `;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f4f4f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col">
      <Header />

      <div className="ambient-glow-primary fixed w-[50vw] h-[50vw] top-[-10%] left-[-10%] pointer-events-none z-0" />
      <div className="ambient-glow-secondary fixed w-[40vw] h-[40vw] bottom-[-10%] right-[-10%] pointer-events-none z-0" />

      <main className="flex-1 flex flex-col px-4 w-full relative z-10 pt-28 md:pt-32 pb-10">
        
        <div className="w-full max-w-[420px] m-auto animate-in fade-in zoom-in-95 duration-500">
          
          {/* Hide title dynamically on Step 4 (Success screen has its own title) */}
          {step !== 4 && (
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm">
                {step === 1 ? "Reset Password" : step === 2 ? "Check Your Email" : "Create New Password"}
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-2">
                {step === 1 ? "Enter your email to receive a secure OTP." 
                : step === 2 ? `We sent a 6-digit code to ${email}`
                : "Your identity is verified. Set your new password."}
              </p>
            </div>
          )}

          <GlassCard>
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* STEP 1: EMAIL INPUT */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1 flex justify-between">
                    Email Address {emailError && <span className="text-red-500 text-[10px] mt-0.5 normal-case tracking-normal">{emailError}</span>}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@example.com"
                      required
                      disabled={isLoading}
                      className={getInputClass(!!emailError)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !!emailError || !email}
                  className="group relative w-full h-12 md:h-14 mt-2 flex items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] outline-none cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
                </button>

                {/* ✅ STEP 1 BACK BUTTON */}
                <div className="mt-4 text-center text-xs md:text-sm">
                  <Link to="/login" className="flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: OTP INPUT */}
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
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      required
                      disabled={isLoading}
                      className={`block w-full h-12 md:h-14 pl-12 pr-4 rounded-xl text-lg md:text-xl font-bold tracking-[0.5em] text-center transition-all duration-300 outline-none
                        bg-white/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal
                        dark:bg-black/40 dark:border-white/10 dark:text-emerald-400 dark:placeholder:text-zinc-700
                        hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60
                      `}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="group relative w-full h-12 md:h-14 mt-2 flex items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                </button>

                {/* ✅ STEP 2 DUAL BACK BUTTONS */}
                <div className="mt-4 text-center text-xs md:text-sm text-zinc-600 dark:text-zinc-400 flex flex-col gap-4">
                  <p>Didn't receive the code? <button type="button" onClick={() => setOtp("")} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline outline-none cursor-pointer">Resend</button></p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-1.5 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none cursor-pointer">
                      <ArrowLeft className="h-4 w-4" /> Change Email
                    </button>
                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700"></div>
                    <Link to="/login" className="font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                      Sign In
                    </Link>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
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
                      className={`block w-full h-12 md:h-14 pl-12 pr-12 rounded-xl text-sm md:text-base font-mono transition-all duration-300 outline-none border bg-white/50 dark:bg-black/40 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:bg-white/80 dark:focus:bg-black/60`} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                      {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="mt-2 animate-in fade-in duration-300">
                      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div key={level} className={`flex-1 transition-colors duration-300 ${passwordScore >= level ? strengthData.color : 'bg-transparent'}`} />
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
                    Repeat Password {passwordError && <span className="text-red-500 text-[10px] mt-0.5">{passwordError}</span>}
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
                      className={`block w-full h-12 md:h-14 pl-12 pr-12 rounded-xl text-sm md:text-base font-mono transition-all duration-300 outline-none border bg-white/50 dark:bg-black/40 text-zinc-900 dark:text-white ${passwordError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-200 dark:border-white/10 focus:border-emerald-500'}`} 
                    />
                    <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer">
                      {showRepeatPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordStrong || !!passwordError}
                  className="group relative w-full h-12 md:h-14 mt-4 flex items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                </button>

                {/* ✅ STEP 3 CANCEL BUTTON */}
                <div className="mt-4 text-center text-xs md:text-sm">
                  <Link to="/login" className="flex items-center justify-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-all outline-none">
                    <ArrowLeft className="h-4 w-4" /> Cancel & Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS STATE */}
            {step === 4 && (
              <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 py-4">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-6">
                  <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Password Updated!</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 px-2">
                  Your password has been successfully changed. You can now sign in to your account with your new credentials.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="group relative w-full h-12 md:h-14 flex items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            )}

          </GlassCard>
        </div>
      </main>
    </div>
  );
}