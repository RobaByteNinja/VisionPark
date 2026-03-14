import React, { useState, useEffect } from "react";
import { Navigation, MapPin, Car, CheckCircle, X, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/ui/StatusBadge";

const DRIVER_LOC = [8.9850, 38.7500];

export default function ActiveSession() {
  const navigate = useNavigate();

  const [sessionState, setSessionState] = useState(() => localStorage.getItem("vp_session_state") || "Discovery");
  const [receiptTimestamp, setReceiptTimestamp] = useState(() => localStorage.getItem("vp_payment_timestamp") || "");
  const [spotData, setSpotData] = useState(() => JSON.parse(localStorage.getItem("vp_selected_spot")) || { id: "--", floor: "--", deposit: 100 });
  const [areaData, setAreaData] = useState(() => JSON.parse(localStorage.getItem("vp_selected_area")) || { name: "--", lat: 0, lon: 0 });
  const driverPayment = localStorage.getItem("vp_driver_payment") || "Telebirr";
  
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  // --- TIMERS & TRACKING STATE ---
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (localStorage.getItem("vp_session_state") === "Reserved") {
      const endTimeStr = localStorage.getItem("vp_session_end_time");
      if (endTimeStr) {
        const remaining = Math.floor((parseInt(endTimeStr, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    }
    return 900; // 15 mins default
  });

  const [parkedSeconds, setParkedSeconds] = useState(() => {
    if (localStorage.getItem("vp_session_state") === "SystemReceipt") {
        return parseInt(localStorage.getItem("vp_final_parked_seconds") || "0", 10);
    }
    return 0; 
  });

  const [entryTimeStr, setEntryTimeStr] = useState(() => {
    const startTs = localStorage.getItem("vp_session_start_time");
    return startTs ? new Date(parseInt(startTs, 10)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";
  });
  
  const [exitTimeStr, setExitTimeStr] = useState(() => localStorage.getItem("vp_session_exit_time") || "--:--");

  // --- RESERVED COUNTDOWN TIMER ---
  useEffect(() => {
    let timer;
    if (sessionState === "Reserved") {
      timer = setInterval(() => {
        const endTimeStr = localStorage.getItem("vp_session_end_time");
        if (endTimeStr) {
          const remaining = Math.floor((parseInt(endTimeStr, 10) - Date.now()) / 1000);
          if (remaining <= 0) {
            clearInterval(timer);
            setSessionState("Expired");
            setSecondsLeft(0);
            localStorage.setItem("vp_session_state", "Expired");
            window.dispatchEvent(new Event("vp_session_changed")); 
          } else {
            setSecondsLeft(remaining);
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionState]);

  // --- SECURED (LIVE PARKING) TIMER ---
  useEffect(() => {
    let timer;
    if (sessionState === "Secured") {
      const startTs = localStorage.getItem("vp_session_start_time");
      if (startTs) {
        const startTime = parseInt(startTs, 10);
        setEntryTimeStr(new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Tick up every second
        timer = setInterval(() => {
          setParkedSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [sessionState]);

  // --- DEV TRIGGERS (TO BE REMOVED WHEN AI CONNECTED) ---
  const handleSimulateArrival = () => {
    const now = Date.now();
    localStorage.setItem("vp_session_start_time", now);
    localStorage.setItem("vp_session_state", "Secured");
    setSessionState("Secured");
    window.dispatchEvent(new Event("vp_session_changed"));
  };

  const handleSystemTriggeredExit = () => {
    const now = Date.now();
    const exitTime = new Date(now).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const ts = new Date(now).toLocaleString();
    
    // Calculate final duration
    const startTs = localStorage.getItem("vp_session_start_time");
    const finalSecs = startTs ? Math.floor((now - parseInt(startTs, 10)) / 1000) : 0;
    
    setReceiptTimestamp(ts);
    setExitTimeStr(exitTime);
    setParkedSeconds(finalSecs);
    
    localStorage.setItem("vp_session_exit_time", exitTime);
    localStorage.setItem("vp_final_parked_seconds", finalSecs);
    localStorage.setItem("vp_session_state", "SystemReceipt");
    localStorage.setItem("vp_payment_timestamp", ts);
    
    setSessionState("SystemReceipt");
    window.dispatchEvent(new Event("vp_session_changed")); 
  };

  // --- FORMATTERS & CALCULATORS ---
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatParkedTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h} : ${m} : ${s}`;
  };

  // Live parking cost: 1 ETB per minute (Minimum 10 ETB charge)
  const calculateLiveCost = (seconds) => {
    return Math.max(10, Math.ceil(seconds / 60) * 1);
  };

  const executeNavigation = () => {
    setIsNavModalOpen(false);
    const deepLink = `https://www.google.com/maps/dir/?api=1&origin=$$${DRIVER_LOC[0]},${DRIVER_LOC[1]}&destination=${areaData.lat},${areaData.lon}&travelmode=driving`;
    window.open(deepLink, "_blank");
  };

  const closeSession = () => {
    localStorage.removeItem("vp_session_state");
    localStorage.removeItem("vp_session_end_time");
    localStorage.removeItem("vp_session_start_time");
    localStorage.removeItem("vp_session_exit_time");
    localStorage.removeItem("vp_final_parked_seconds");
    localStorage.removeItem("vp_selected_area");
    localStorage.removeItem("vp_selected_spot");
    window.dispatchEvent(new Event("vp_session_changed")); 
    navigate("/driver/map");
  };

  if (sessionState === "Discovery" || sessionState === "PaymentSuccess") {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center bg-[#f4f4f5] dark:bg-[#09090b] px-6 text-center transition-colors duration-500">
        <div className="h-20 w-20 md:h-24 md:w-24 bg-zinc-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <MapPin className="h-10 w-10 md:h-12 md:w-12 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-base md:text-lg lg:text-xl font-medium text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
          No active session found. Head to the map to reserve a spot.
        </p>
        <button 
          type="button" 
          onClick={() => navigate("/driver/map")} 
          className="h-12 md:h-14 lg:h-16 px-8 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm md:text-base lg:text-lg tracking-wide uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:bg-emerald-400 active:scale-95 transition-all outline-none cursor-pointer"
        >
          Go to Map
        </button>
      </div>
    );
  }

  return (
    // ✅ Changed min-h to h-full so it perfectly matches DriverLayout constraints
    <div className="relative h-full w-full overflow-y-auto bg-[#f4f4f5] dark:bg-[#09090b] pt-24 px-4 md:px-8 flex flex-col items-center overscroll-none transition-colors duration-500">
      
      <div className="relative z-10 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col gap-6 lg:gap-8">
        
        {/* --- 1. RESERVED STATE --- */}
        {sessionState === "Reserved" && (
          <div className="w-full bg-white dark:bg-[#0f0f12]/95 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl dark:shadow-2xl transition-all flex flex-col">
            <div className="flex items-start justify-between mb-8 border-b border-zinc-100 dark:border-white/5 pb-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Car className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-zinc-900 dark:text-white font-bold text-lg md:text-xl lg:text-3xl truncate">Spot {spotData.id}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm lg:text-base flex items-center gap-1.5 mt-0.5 md:mt-1 truncate">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" /> {areaData.name}
                  </p>
                </div>
              </div>
              <div className="shrink-0 ml-4"><StatusBadge status="Reserved" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-1 md:order-2 text-center flex flex-col justify-center h-full">
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold font-mono text-zinc-900 dark:text-white tracking-tight drop-shadow-md">
                  {formatTime(secondsLeft)}
                </h1>
                <div className="relative w-full h-2 md:h-3 lg:h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-6 mb-4 overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-[width] duration-1000 ease-linear rounded-full" style={{ width: `${(secondsLeft / 900) * 100}%` }}></div>
                </div>
                <p className="text-xs md:text-sm lg:text-base text-amber-600 dark:text-amber-500 uppercase font-bold tracking-widest animate-pulse">15 min Hold Time</p>
              </div>

              <div className="order-2 md:order-1 flex flex-col gap-6 md:gap-8 justify-center">
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center bg-zinc-50 dark:bg-black/20 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-white/5">
                  <div><p className="text-[10px] md:text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1 md:mb-2">Deposit</p><p className="text-zinc-900 dark:text-white font-bold text-lg md:text-2xl lg:text-3xl">{spotData.deposit} <span className="text-xs md:text-sm text-zinc-500 font-normal">ETB</span></p></div>
                  <div className="border-l border-r border-zinc-200 dark:border-white/5"><p className="text-[10px] md:text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1 md:mb-2">Duration</p><p className="text-zinc-900 dark:text-white font-bold text-lg md:text-2xl lg:text-3xl">2<span className="text-xs md:text-sm text-zinc-500 font-normal">h</span></p></div>
                  <div><p className="text-[10px] md:text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1 md:mb-2">Floor</p><p className="text-zinc-900 dark:text-white font-bold text-lg md:text-2xl lg:text-3xl">{spotData.floor}</p></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
                  <button type="button" onClick={handleSimulateArrival} className="w-full sm:flex-[1] h-14 lg:h-16 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-bold text-xs lg:text-sm tracking-wide uppercase hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer">
                     [Simulate Arrival]
                  </button>

                  <button type="button" onClick={() => setIsNavModalOpen(true)} className="w-full sm:flex-[2] h-14 lg:h-16 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm lg:text-base tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-colors outline-none cursor-pointer">
                    <Navigation className="h-5 w-5 md:h-6 md:w-6" /> Navigate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. SECURED STATE (LIVE PARKING) --- */}
        {sessionState === "Secured" && (
          <div className="w-full bg-white dark:bg-[#0f0f12]/95 border border-emerald-500/30 rounded-3xl p-6 md:p-12 shadow-xl dark:shadow-2xl flex flex-col items-center">
            
            <div className="flex w-full items-center justify-between mb-2">
              <div className="min-w-0 pr-4">
                <h3 className="text-zinc-900 dark:text-white font-bold text-lg md:text-2xl truncate">Spot {spotData.id}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base truncate">{areaData.name}</p>
              </div>
              <StatusBadge status="Secured" />
            </div>

            <div className="w-full border-t border-zinc-100 dark:border-white/5 my-6"></div>

            {/* LIVE PARKING TIMER */}
            <div className="text-center flex flex-col justify-center items-center w-full">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 uppercase font-bold tracking-widest mb-4">
                <Clock className="h-4 w-4 md:h-5 md:w-5 animate-spin-slow" /> Time Parked
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-mono text-zinc-900 dark:text-white tracking-tight drop-shadow-md mb-8 whitespace-nowrap">
                {formatParkedTime(parkedSeconds)}
              </h1>
              
              <div className="grid grid-cols-3 gap-2 md:gap-4 w-full text-center bg-zinc-50 dark:bg-black/20 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-white/5">
                <div>
                  <p className="text-[10px] md:text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Entry Time</p>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm sm:text-base md:text-xl">{entryTimeStr}</p>
                </div>
                <div className="border-l border-r border-zinc-200 dark:border-white/5 px-1">
                  <p className="text-[10px] md:text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Current Rate</p>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm sm:text-base md:text-xl">1 ETB<span className="text-[9px] md:text-[10px] lg:text-xs font-normal text-zinc-500">/min</span></p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs lg:text-sm text-emerald-600 dark:text-emerald-500 uppercase font-bold tracking-wider mb-1">Accrued Fee</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base md:text-xl">{calculateLiveCost(parkedSeconds)} ETB</p>
                </div>
              </div>
            </div>

            <button type="button" onClick={handleSystemTriggeredExit} className="mt-8 w-full h-12 md:h-14 flex items-center justify-center gap-2 rounded-xl border border-dashed border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 font-bold text-xs md:text-sm tracking-wide uppercase hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors outline-none cursor-pointer">
              [Dev: Simulate Camera Exit]
            </button>

          </div>
        )}

        {/* --- 3. EXPIRED STATE --- */}
        {sessionState === "Expired" && (
          <div className="w-full bg-white dark:bg-[#121214]/95 border border-amber-500/50 rounded-3xl p-8 md:p-12 shadow-xl dark:shadow-2xl text-center">
            <div className="flex justify-center mb-6"><AlertTriangle className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" /></div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white mb-4">Reservation expired</h2>
            <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 mb-8 md:mb-10 max-w-lg mx-auto">You did not arrive within the 15-minute window. The spot has been returned to Free status.</p>
            <button type="button" onClick={closeSession} className="w-full h-14 lg:h-16 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-sm lg:text-base tracking-wide uppercase hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors outline-none cursor-pointer">Return to Map</button>
          </div>
        )}

        {/* ✅ INVISIBLE SPACER TO PUSH CONTENT ABOVE THE NAV BAR */}
        <div className="h-32 md:h-40 w-full shrink-0"></div>

      </div>

      {/* --- 4. RECEIPT MODAL --- */}
      {sessionState === "SystemReceipt" && (
        <div className="fixed inset-0 z-[6000] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md md:max-w-lg bg-white dark:bg-[#121214] border border-emerald-500/50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <button type="button" onClick={closeSession} className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white cursor-pointer outline-none transition-colors"><X className="h-5 w-5" /></button>
            <div className="flex justify-center mb-4 mt-2"><CheckCircle className="h-16 w-16 md:h-20 md:w-20 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" /></div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white text-center mb-8">Payment sent successfully</h2>
            
            {/* DYNAMIC RECEIPT DATA */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm md:text-base lg:text-lg"><span className="text-zinc-500 dark:text-zinc-400">Entry Time</span><span className="font-bold text-zinc-900 dark:text-white">{entryTimeStr}</span></div>
              <div className="flex justify-between text-sm md:text-base lg:text-lg"><span className="text-zinc-500 dark:text-zinc-400">Exit Time</span><span className="font-bold text-zinc-900 dark:text-white">{exitTimeStr}</span></div>
              
              <div className="pt-3 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center text-sm md:text-base lg:text-lg"><span className="text-zinc-500 dark:text-zinc-400">Total Duration</span><span className="font-bold text-zinc-900 dark:text-white font-mono tracking-wider">{formatParkedTime(parkedSeconds)}</span></div>
              
              <div className="pt-3 border-t border-zinc-200 dark:border-white/10 flex justify-between text-sm md:text-base lg:text-lg"><span className="text-zinc-500 dark:text-zinc-400">Reservation fee</span><span className="font-bold text-zinc-900 dark:text-white">{spotData.deposit} ETB</span></div>
              <div className="flex justify-between text-sm md:text-base lg:text-lg"><span className="text-zinc-500 dark:text-zinc-400">Parking fee</span><span className="font-bold text-zinc-900 dark:text-white">{calculateLiveCost(parkedSeconds)} ETB</span></div>
              
              <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center text-lg md:text-xl lg:text-2xl mt-2"><span className="font-bold text-zinc-900 dark:text-white">Total Paid</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{spotData.deposit + calculateLiveCost(parkedSeconds)} ETB</span></div>
            </div>

            <div className="flex flex-col gap-3 mt-6 lg:mt-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Billed To Merchant</span>
                  <span className="text-sm md:text-base lg:text-lg font-bold text-zinc-900 dark:text-white">VisionPark System</span>
                </div>
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
              </div>

              <div className="bg-zinc-50 dark:bg-black/40 rounded-xl p-4 md:p-5 text-left border border-zinc-200 dark:border-white/5">
                <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 mb-1 flex justify-between gap-4">
                  <span className="shrink-0">Paid From:</span> <span className="text-zinc-900 dark:text-white font-bold text-right truncate pl-2">{driverPayment} via Chapa</span>
                </p>
                <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 flex justify-between gap-4">
                  <span className="shrink-0">Timestamp:</span> <span className="text-zinc-900 dark:text-white font-bold text-right truncate pl-2">{receiptTimestamp}</span>
                </p>
              </div>
            </div>

            <button type="button" onClick={closeSession} className="w-full h-12 md:h-14 lg:h-16 mt-6 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-sm md:text-base tracking-wide uppercase hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors outline-none cursor-pointer">Done</button>
          </div>
        </div>
      )}

      {/* --- NAVIGATION MODAL --- */}
      {isNavModalOpen && (
        <div className="fixed inset-0 z-[7000] bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg bg-white dark:bg-[#121214]/95 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <Navigation className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mb-2">Open Google Maps?</h2>
            <p className="text-sm md:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 mb-8">You are about to leave VisionPark to get live routing from your current location to {areaData.name}.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsNavModalOpen(false)} className="flex-1 h-12 md:h-14 lg:h-16 rounded-xl border border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-white font-bold text-sm md:text-base hover:bg-zinc-100 dark:hover:bg-white/5 transition outline-none cursor-pointer">Cancel</button>
              <button type="button" onClick={executeNavigation} className="flex-1 h-12 md:h-14 lg:h-16 rounded-xl bg-blue-600 text-white font-bold text-sm md:text-base hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition outline-none cursor-pointer">Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}