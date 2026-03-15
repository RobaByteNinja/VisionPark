import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { 
  MapPin, Car, CheckCircle, AlertTriangle, ChevronDown, 
  X, Check, Building2, Navigation, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Header } from "../../components/layout/Header";
import { useNavigate } from "react-router-dom";

const DRIVER_LOC = [9.0000, 38.7700];
const PAYMENT_OPTIONS = ["Telebirr", "CBE", "COOP", "Bank of Abyssinia"];

const generateSpots = () => [
  { id: "V-08", status: "Free",    floor: "B1",      deposit: 100, vehicleType: "Public Transport Vehicles | Upto 12 Seats" },
  { id: "A-02", status: "Free",    floor: "Ground",  deposit: 100, vehicleType: "Dry Freight Vehicles | <35 Quintal" },
  { id: "B-01", status: "Secured", floor: "Level 1", deposit: 100, vehicleType: "Public Transport Vehicles | Upto 12 Seats" },
];

const INITIAL_AREAS = [
  { id: "PA-01", name: "Megenagna SMART",   lat: 9.0206, lon: 38.7996, price: 35.0, availableSpaces: 17,  spots: generateSpots() },
  { id: "PA-02", name: "Meskel Square",      lat: 9.0104, lon: 38.7611, price: 35.0, availableSpaces: 24,  spots: generateSpots() },
  { id: "PA-03", name: "Bole Int. Airport",  lat: 8.9837, lon: 38.7963, price: 50.0, availableSpaces: 112, spots: generateSpots() },
  { id: "PA-04", name: "Edna Mall",          lat: 8.9971, lon: 38.7866, price: 40.0, availableSpaces: 5,   spots: generateSpots() },
  { id: "PA-05", name: "Dembel City Center", lat: 9.0049, lon: 38.7668, price: 30.0, availableSpaces: 41,  spots: generateSpots() },
  { id: "PA-06", name: "Millennium Hall",    lat: 8.9902, lon: 38.7895, price: 45.0, availableSpaces: 80,  spots: generateSpots() },
  { id: "PA-07", name: "Hilton Addis Ababa", lat: 9.0186, lon: 38.7646, price: 60.0, availableSpaces: 12,  spots: generateSpots() },
];

const mockHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
  const y = (lat2 - lat1);
  return Math.sqrt(x * x + y * y) * R;
};

// ─── ICONS — defined at module level, never recreated ─────────────────────────
const driverIcon = L.divIcon({
  className: "custom-driver-marker",
  html: `<div class="relative flex h-8 w-8 items-center justify-center">
    <div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40"></div>
    <div class="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md z-10"></div>
  </div>`,
  iconSize: [32, 32],
});

const createIcon = (isFocused, theme) => L.divIcon({
  className: "custom-p-marker",
  html: `<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 ${
    isFocused
      ? "border-amber-400 bg-emerald-500 scale-110 z-50 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
      : `${theme === "dark" ? "border-[#09090b]" : "border-white"} bg-emerald-500/80 shadow-md`
  } transition-all duration-300">
    <span class="text-sm font-bold text-zinc-950">P</span>
  </div>`,
  iconSize: [40, 40],
});

// ─── MAP CAMERA — inside map context ─────────────────────────────────────────
function MapCamera({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14, { animate: true, duration: 0.5 });
    }
  }, [lat, lon, map]);
  return null;
}

// ─── THE MAP — memo() means it NEVER re-renders unless its own props change ───
// This is the key fix: carousel state lives in the parent but never touches this component
const ParkingMap = memo(({ areas, focusedAreaId, tileUrl, onMarkerClick }) => {
  const normalIcon  = useMemo(() => createIcon(false, tileUrl.includes("dark") ? "dark" : "light"), [tileUrl]);
  const focusedIcon = useMemo(() => createIcon(true,  tileUrl.includes("dark") ? "dark" : "light"), [tileUrl]);
  const focusedArea = areas.find(a => a.id === focusedAreaId);

  return (
    <MapContainer
      center={DRIVER_LOC}
      zoom={13}
      zoomControl={false}
      preferCanvas={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      className="h-full w-full outline-none"
    >
      <TileLayer
        url={tileUrl}
        detectRetina={false}
        keepBuffer={4}
        updateWhenIdle={true}
        updateWhenZooming={false}
      />
      <Marker position={DRIVER_LOC} icon={driverIcon} zIndexOffset={1000} />
      {areas.map((area) => (
        <Marker
          key={area.id}
          position={[area.lat, area.lon]}
          icon={area.id === focusedAreaId ? focusedIcon : normalIcon}
          eventHandlers={{ click: () => onMarkerClick(area.id) }}
        />
      ))}
      {focusedArea && <MapCamera lat={focusedArea.lat} lon={focusedArea.lon} />}
    </MapContainer>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DriverMap() {
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [areas, setAreas]               = useState([]);
  const [focusedAreaId, setFocusedAreaId] = useState(null);
  const [selectedArea, setSelectedArea]   = useState(null);
  const [selectedSpot, setSelectedSpot]   = useState(null);
  const [uiState, setUiState]             = useState("Discovery");

  const driverVehicle  = localStorage.getItem("vp_driver_vehicle") || "Public Transport Vehicles | Upto 12 Seats";
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem("vp_driver_payment") || "Telebirr");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTimestamp, setPaymentTimestamp] = useState(null);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX,   setTouchEndX]   = useState(null);

  // Tile URL — memoised so TileLayer never remounts
  const mapTileUrl = useMemo(() =>
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  [theme]);

  useEffect(() => {
    let minDist = Infinity, nearestId = null;
    const sorted = INITIAL_AREAS.map((area) => {
      const dist = mockHaversineDistance(DRIVER_LOC[0], DRIVER_LOC[1], area.lat, area.lon);
      if (dist < minDist) { minDist = dist; nearestId = area.id; }
      return { ...area, distance: dist };
    }).sort((a, b) => a.distance - b.distance);
    setAreas(sorted);
    setFocusedAreaId(nearestId);
  }, []);

  const activeIndex     = areas.findIndex(a => a.id === focusedAreaId);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // useCallback so these refs stay stable and don't cause ParkingMap to re-render
  const handleMarkerClick = useCallback((areaId) => {
    setFocusedAreaId(areaId);
    setSelectedArea(null);
    setSelectedSpot(null);
  }, []);

  const handleNext = useCallback(() => {
    setAreas(prev => {
      const idx  = prev.findIndex(a => a.id === focusedAreaId);
      const safe = idx >= 0 ? idx : 0;
      const next = (safe + 1) % prev.length;
      setFocusedAreaId(prev[next].id);
      setSelectedArea(null);
      setSelectedSpot(null);
      return prev;
    });
  }, [focusedAreaId]);

  const handlePrev = useCallback(() => {
    setAreas(prev => {
      const idx  = prev.findIndex(a => a.id === focusedAreaId);
      const safe = idx >= 0 ? idx : 0;
      const prev2 = (safe - 1 + prev.length) % prev.length;
      setFocusedAreaId(prev[prev2].id);
      setSelectedArea(null);
      setSelectedSpot(null);
      return prev;
    });
  }, [focusedAreaId]);

  const getOffset = (index) => {
    let offset = index - safeActiveIndex;
    const half = Math.floor(areas.length / 2);
    if (offset > half)  offset -= areas.length;
    if (offset < -half) offset += areas.length;
    return offset;
  };

  const onTouchStart = (e) => { e.stopPropagation(); setTouchStartX(e.targetTouches[0].clientX); setTouchEndX(null); };
  const onTouchMove  = (e) => { e.stopPropagation(); setTouchEndX(e.targetTouches[0].clientX); };
  const onTouchEnd   = (e) => {
    e.stopPropagation();
    if (!touchStartX || !touchEndX) return;
    const d = touchStartX - touchEndX;
    if (d > 50)  handleNext();
    if (d < -50) handlePrev();
  };

  const updateSpotStatus = (areaId, spotId, newStatus) => {
    setAreas(prev => prev.map(area =>
      area.id !== areaId ? area :
      { ...area, spots: area.spots.map(s => s.id === spotId ? { ...s, status: newStatus } : s) }
    ));
  };

  const handleProcessPayment = () => {
    const timestamp = new Date().toLocaleString();
    const endTime   = Date.now() + 15 * 60 * 1000;
    localStorage.setItem("vp_session_state",     "Reserved");
    localStorage.setItem("vp_selected_area",      JSON.stringify(selectedArea));
    localStorage.setItem("vp_selected_spot",      JSON.stringify(selectedSpot));
    localStorage.setItem("vp_session_end_time",   endTime.toString());
    localStorage.setItem("vp_session_start_time", Date.now().toString());
    localStorage.setItem("vp_payment_timestamp",  timestamp);
    localStorage.setItem("vp_driver_payment",     paymentMethod);
    setPaymentTimestamp(timestamp);
    setUiState("PaymentSuccess");
    updateSpotStatus(selectedArea.id, selectedSpot.id, "Reserved");
    window.dispatchEvent(new Event("vp_session_changed"));
    setTimeout(() => navigate("/driver/session"), 2500);
  };

  const openGoogleMaps = (lat, lon) => {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${DRIVER_LOC[0]},${DRIVER_LOC[1]}&destination=${lat},${lon}&travelmode=driving`, "_blank");
  };

  const getStatusColor = (status) => {
    if (status === "Free")     return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (status === "Reserved") return "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";
    if (status === "Secured")  return "text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10";
    return "";
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-zinc-100 dark:bg-[#09090b]">
      <Header />

      {/* MAP — isolated in memo, never re-renders on carousel swipe */}
      <div className="absolute inset-0 z-0">
        <ParkingMap
          areas={areas}
          focusedAreaId={focusedAreaId}
          tileUrl={mapTileUrl}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* ── CAROUSEL ──────────────────────────────────────────────────────── */}
      {!selectedArea && (
        <div
          className="absolute bottom-24 md:bottom-28 w-full z-[1000] h-[280px] flex items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button onClick={handlePrev} className="hidden md:flex absolute left-4 md:left-10 z-50 h-14 w-14 bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-white/10 rounded-full shadow-xl items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer">
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative w-full max-w-[340px] h-full flex items-center justify-center">
            {areas.map((area, index) => {
              const offset    = getOffset(index);
              const absOffset = Math.abs(offset);
              const isFocused = offset === 0;
              return (
                <div
                  key={area.id}
                  onClick={() => handleMarkerClick(area.id)}
                  className={`absolute w-[85vw] max-w-[340px] rounded-3xl p-5 md:p-6 flex gap-4 md:gap-5 cursor-pointer transition-all duration-200 ease-out ${
                    isFocused
                      ? "bg-white dark:bg-[#1f1f22] border border-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500"
                      : "bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-white/10 shadow-xl"
                  }`}
                  style={{
                    transform:     `translate3d(calc(${offset * 100}% + ${offset * 20}px), 0, 0) scale(${isFocused ? 1 : 0.85})`,
                    zIndex:        50 - absOffset,
                    opacity:       absOffset > 1 ? 0 : isFocused ? 1 : 0.7,
                    pointerEvents: absOffset > 1 ? "none" : "auto",
                    willChange:    "transform",
                  }}
                >
                  <div className="mt-1 flex-shrink-0">
                    <Building2 className={`h-6 w-6 md:h-7 md:w-7 ${isFocused ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className={`font-bold text-lg md:text-xl leading-tight mb-2 truncate ${isFocused ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {area.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{area.price.toFixed(1)} ETB / Hr</span>
                      <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-sm">
                        <span className="text-red-500 font-bold">P</span> {area.availableSpaces} Spaces
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                      <Navigation className="h-4 w-4 text-emerald-500" fill="currentColor" />
                      {area.distance?.toFixed(2)} Km away
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openGoogleMaps(area.lat, area.lon); }}
                        className="h-10 w-12 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-90 transition-all outline-none cursor-pointer"
                      >
                        <Navigation className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFocusedAreaId(area.id); setSelectedArea(area); setSelectedSpot(null); setUiState("Discovery"); }}
                        className="flex-1 h-10 rounded-xl bg-zinc-900 dark:bg-[#27272a] text-white font-bold text-sm hover:bg-zinc-800 dark:hover:bg-white/10 active:scale-95 transition-all outline-none cursor-pointer"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start justify-end">
                    <div className={`h-10 w-10 border-[3px] rounded-full rounded-tr-none rotate-45 flex items-center justify-center shadow-lg ${isFocused ? "bg-[#121214] border-emerald-400" : "bg-[#121214] border-amber-400"}`}>
                      <Car className={`h-5 w-5 -rotate-45 ${isFocused ? "text-emerald-400" : "text-amber-400"}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleNext} className="hidden md:flex absolute right-4 md:right-10 z-50 h-14 w-14 bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-white/10 rounded-full shadow-xl items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* ── FLOATING PANELS ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-[4000] p-4 pb-28 md:pb-8 flex items-center justify-center pointer-events-none">

        {/* 1. DISCOVERY PANEL */}
        {selectedArea && !selectedSpot && uiState === "Discovery" && (
          <div className="w-full max-w-sm md:max-w-md bg-white/95 dark:bg-[#121214]/95 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-6 w-6 text-emerald-500" /> {selectedArea.name}
              </h2>
              <button onClick={() => setSelectedArea(null)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 outline-none cursor-pointer active:scale-90">
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="p-5 md:p-6 overflow-y-auto overscroll-contain flex-1 flex flex-col gap-3">
              {selectedArea.spots.map((spot) => {
                const isCompatible = spot.vehicleType === driverVehicle;
                const canSelect    = isCompatible && spot.status === "Free";
                return (
                  <div
                    key={spot.id}
                    onClick={() => canSelect && setSelectedSpot(spot)}
                    className={`flex flex-col p-4 rounded-xl border transition-all shrink-0 ${
                      canSelect
                        ? "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-[0.98] cursor-pointer"
                        : "border-zinc-200 dark:border-white/5 bg-zinc-200/50 dark:bg-black/40 opacity-70 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white font-mono text-base">{spot.id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${getStatusColor(spot.status)}`}>{spot.status}</span>
                    </div>
                    {!isCompatible && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Not compatible
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PAYMENT PANEL */}
        {selectedSpot && uiState === "Discovery" && (
          <div className="w-full max-w-sm md:max-w-md bg-white/95 dark:bg-[#121214]/95 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <h3 className="text-zinc-900 dark:text-white font-bold text-xl flex items-center gap-2">
                <Car className="h-6 w-6 text-emerald-500" /> Spot {selectedSpot.id}
              </h3>
              <button onClick={() => { setSelectedArea(null); setSelectedSpot(null); }} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 outline-none cursor-pointer active:scale-90">
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="p-5 md:p-6 overflow-y-auto overscroll-contain flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-100 dark:bg-black/40 rounded-xl p-4 border border-zinc-200 dark:border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Deposit</p>
                  <p className="text-zinc-900 dark:text-white font-bold text-lg">{selectedSpot.deposit} ETB</p>
                </div>
                <div className="bg-zinc-100 dark:bg-black/40 rounded-xl p-4 border border-zinc-200 dark:border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Floor</p>
                  <p className="text-zinc-900 dark:text-white font-bold text-lg">{selectedSpot.floor}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 pb-6">
                <span className="font-bold text-zinc-900 dark:text-zinc-300">Vehicle Type:</span> {selectedSpot.vehicleType}
              </p>
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 block">Billed To Merchant</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">VisionPark System</span>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pay From (Your Account)</label>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full h-12 px-4 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none hover:border-emerald-500 active:scale-[0.98] cursor-pointer flex items-center justify-between transition-all"
                >
                  <span className="font-medium text-sm">{paymentMethod}{paymentMethod === "Telebirr" && " (Default)"}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                </button>
              </div>
            </div>
            <div className="p-5 md:p-6 border-t border-zinc-200 dark:border-white/10 shrink-0 flex gap-3">
              <button type="button" onClick={() => setSelectedSpot(null)} className="flex-1 h-12 rounded-xl border border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-white font-bold text-sm hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95 cursor-pointer outline-none transition-all">
                Back
              </button>
              <button type="button" onClick={handleProcessPayment} className="flex-[2] h-12 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm uppercase tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 active:scale-95 cursor-pointer outline-none transition-all">
                Pay {selectedSpot.deposit} ETB
              </button>
            </div>
          </div>
        )}

        {/* 3. PAYMENT SUCCESS */}
        {uiState === "PaymentSuccess" && (
          <div className="w-full max-w-sm md:max-w-md bg-white/95 dark:bg-[#121214]/95 border border-emerald-500/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl pointer-events-auto text-center animate-in zoom-in-95 duration-300 flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment sent successfully</h2>
            <div className="w-full bg-zinc-50 dark:bg-black/40 rounded-xl p-4 text-left border border-zinc-200 dark:border-white/5 mt-6 space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-between gap-2">
                <span className="shrink-0">Method:</span>
                <span className="text-zinc-900 dark:text-white font-bold text-right truncate">{paymentMethod} via Chapa</span>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-between gap-2">
                <span className="shrink-0">Timestamp:</span>
                <span className="text-zinc-900 dark:text-white font-bold text-right truncate">{paymentTimestamp}</span>
              </p>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mt-6 animate-pulse">
              Redirecting to Active Session...
            </p>
          </div>
        )}
      </div>

      {/* ── PAYMENT METHOD MODAL ──────────────────────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm md:max-w-md bg-white dark:bg-[#121214] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Select Payment Method</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 outline-none cursor-pointer active:scale-90">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 overscroll-contain flex-1">
              {PAYMENT_OPTIONS.map((method, index) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={index}
                    onClick={() => { setPaymentMethod(method); setShowPaymentModal(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all outline-none cursor-pointer active:scale-[0.98] ${
                      isSelected ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-sm ${isSelected ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>
                      {method}{method === "Telebirr" && " (Default)"}
                    </span>
                    {isSelected && <Check className="h-5 w-5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}