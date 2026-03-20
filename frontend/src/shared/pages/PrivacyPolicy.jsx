import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Scale, FileText, Lock } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Header } from "../../components/layout/Header";

export default function PrivacyPolicy() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem("vp_theme");
    if (!savedTheme) setTheme("light");
    else setTheme(savedTheme);
  }, [setTheme]);

  return (
    // FIX: `auth-page` hides the scrollbar — this div owns overflow-y-auto
    <div className="auth-page relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f4f4f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col font-sans">

      <Header />

      <div className="ambient-glow-primary fixed w-[50vw] h-[50vw] top-[-10%] left-[-10%] pointer-events-none z-0" />
      <div className="ambient-glow-secondary fixed w-[40vw] h-[40vw] bottom-[-10%] right-[-10%] pointer-events-none z-0" />

      <main className="flex-1 flex flex-col px-4 md:px-8 w-full relative z-10 pt-28 md:pt-32 pb-20">
        <div className="w-full max-w-3xl m-auto animate-in fade-in zoom-in-95 duration-500">

          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-6">
              <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 font-medium tracking-wide max-w-xl">
              VisionPark operates in strict accordance with the Constitution of the Federal Democratic Republic of Ethiopia.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-6 md:p-10 lg:p-12 shadow-xl">

            {/* CONSTITUTIONAL TEXT SECTION */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-200 dark:border-white/10 pb-4">
                <Scale className="h-6 w-6 text-indigo-500" />
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
                  Article 26: Right to Privacy
                </h2>
              </div>

              <div className="space-y-6 text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <p className="flex gap-4">
                  <span className="font-bold text-indigo-500 text-lg">1.</span>
                  <span>Everyone has the right to privacy. This right shall include the right not to be subject to searches of his home, person or property, or the seizure of property under his personal possession.</span>
                </p>
                <p className="flex gap-4">
                  <span className="font-bold text-indigo-500 text-lg">2.</span>
                  <span>Everyone has the right to the inviolability of his notes and correspondence including postal letters, and communications made by means of telephone, telecommunications and electronic devices.</span>
                </p>
                <p className="flex gap-4">
                  <span className="font-bold text-indigo-500 text-lg">3.</span>
                  <span>Public officials shall respect and protect these rights. No restrictions may be placed on the enjoyment of such rights except in compelling circumstances and in accordance with specific laws whose purposes shall be the safeguarding of national security or public peace, the prevention of crimes or the protection of health, public morals or the rights and freedoms of others.</span>
                </p>
              </div>
            </div>

            {/* VISIONPARK COMMITMENT SECTION */}
            <div>
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-200 dark:border-white/10 pb-4">
                <Lock className="h-6 w-6 text-emerald-500" />
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
                  VisionPark Data Commitment
                </h2>
              </div>

              <div className="space-y-4 text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <p>
                  By registering an account with VisionPark, we securely collect essential operational data, including your{" "}
                  <strong className="text-zinc-900 dark:text-white">Name, Phone Number, Email, and Vehicle License Plate</strong>.
                </p>
                <p>In absolute compliance with Article 26 of the FDRE Constitution:</p>
                <ul className="list-none space-y-3 mt-4">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Your data is heavily encrypted and stored securely within local data centers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>VisionPark will <strong>never</strong> sell, share, or distribute your telecommunication information or vehicle logs to third-party marketing agencies.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Data may only be disclosed to authorized legal or public officials strictly under the compelling circumstances outlined in Article 26, Clause 3 (e.g., a formal court order).</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/10 flex justify-center">
              <button
                onClick={() => window.close()}
                className="group relative h-12 md:h-14 px-8 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base tracking-wide uppercase overflow-hidden transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                I Understand, Close Tab
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}