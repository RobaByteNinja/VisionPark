import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
    MapPin, Car, ChevronLeft, ChevronRight, Building2,
    Navigation, ExternalLink, X, UserPlus, LogIn, Compass
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const DEFAULT_LOC = [9.0249, 38.7468];

const INITIAL_AREAS = [
    { id: "PA-01", name: "Megenagna SMART", lat: 9.0206, lon: 38.7996, price: 35.0, availableSpaces: 17 },
    { id: "PA-02", name: "Meskel Square", lat: 9.0104, lon: 38.7611, price: 35.0, availableSpaces: 24 },
    { id: "PA-03", name: "Bole Int. Airport", lat: 8.9837, lon: 38.7963, price: 50.0, availableSpaces: 112 },
    { id: "PA-04", name: "Edna Mall", lat: 8.9971, lon: 38.7866, price: 40.0, availableSpaces: 5 },
    { id: "PA-05", name: "Dembel City Center", lat: 9.0049, lon: 38.7668, price: 30.0, availableSpaces: 41 },
    { id: "PA-06", name: "Millennium Hall", lat: 8.9902, lon: 38.7895, price: 45.0, availableSpaces: 80 },
    { id: "PA-07", name: "Hilton Addis Ababa", lat: 9.0186, lon: 38.7646, price: 60.0, availableSpaces: 12 },
];

const mockHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    const y = (lat2 - lat1);
    return Math.sqrt(x * x + y * y) * R;
};

const driverIcon = L.divIcon({
    className: "custom-driver-marker",
    html: `<div class="relative flex h-8 w-8 items-center justify-center">
    <div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40"></div>
    <div class="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md z-10 flex items-center justify-center"></div>
  </div>`,
    iconSize: [32, 32],
});

const createIcon = (isFocused, theme) => L.divIcon({
    className: "custom-p-marker",
    html: `<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 ${isFocused
        ? "border-amber-400 bg-emerald-500 scale-110 z-50 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
        : `${theme === "dark" ? "border-[#09090b]" : "border-white"} bg-emerald-500/80 shadow-md`
        } transition-all duration-300">
    <span class="text-sm font-bold text-zinc-950">P</span>
  </div>`,
    iconSize: [40, 40],
});

function MapCamera({ lat, lon }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) {
            map.setView([lat, lon], 14, { animate: true, duration: 0.5 });
        }
    }, [lat, lon, map]);
    return null;
}

const ParkingMap = memo(({ areas, focusedAreaId, tileUrl, onMarkerClick, userLocation }) => {
    const normalIcon = useMemo(() => createIcon(false, tileUrl.includes("dark") ? "dark" : "light"), [tileUrl]);
    const focusedIcon = useMemo(() => createIcon(true, tileUrl.includes("dark") ? "dark" : "light"), [tileUrl]);
    const focusedArea = areas.find(a => a.id === focusedAreaId);

    return (
        <MapContainer
            center={userLocation}
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
            <Marker position={userLocation} icon={driverIcon} zIndexOffset={1000} />
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

export default function GuestMap() {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(DEFAULT_LOC);
    const [areas, setAreas] = useState([]);
    const [focusedAreaId, setFocusedAreaId] = useState(null);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingMapRoute, setPendingMapRoute] = useState(null);

    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);

    useEffect(() => {
        if (!setTheme) return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        setTheme(mediaQuery.matches ? "dark" : "light");

        const handleChange = (e) => {
            setTheme(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [setTheme]);

    const mapTileUrl = useMemo(() =>
        theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        [theme]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Geolocation access denied or failed. Using default location.", error);
                    setUserLocation(DEFAULT_LOC);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

    useEffect(() => {
        const sorted = INITIAL_AREAS.map((area) => {
            const dist = mockHaversineDistance(userLocation[0], userLocation[1], area.lat, area.lon);
            return { ...area, distance: dist };
        }).sort((a, b) => a.distance - b.distance);

        setAreas(sorted);
        if (sorted.length > 0 && !focusedAreaId) {
            setFocusedAreaId(sorted[0].id);
        }
    }, [userLocation, focusedAreaId]);

    const activeIndex = areas.findIndex(a => a.id === focusedAreaId);
    const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

    const handleMarkerClick = useCallback((areaId) => {
        setFocusedAreaId(areaId);
    }, []);

    const handleNext = useCallback(() => {
        setAreas(prev => {
            const idx = prev.findIndex(a => a.id === focusedAreaId);
            const safe = idx >= 0 ? idx : 0;
            const next = (safe + 1) % prev.length;
            setFocusedAreaId(prev[next].id);
            return prev;
        });
    }, [focusedAreaId]);

    const handlePrev = useCallback(() => {
        setAreas(prev => {
            const idx = prev.findIndex(a => a.id === focusedAreaId);
            const safe = idx >= 0 ? idx : 0;
            const prev2 = (safe - 1 + prev.length) % prev.length;
            setFocusedAreaId(prev[prev2].id);
            return prev;
        });
    }, [focusedAreaId]);

    const getOffset = (index) => {
        let offset = index - safeActiveIndex;
        const half = Math.floor(areas.length / 2);
        if (offset > half) offset -= areas.length;
        if (offset < -half) offset += areas.length;
        return offset;
    };

    const onTouchStart = (e) => { e.stopPropagation(); setTouchStartX(e.targetTouches[0].clientX); setTouchEndX(null); };
    const onTouchMove = (e) => { e.stopPropagation(); setTouchEndX(e.targetTouches[0].clientX); };
    const onTouchEnd = (e) => {
        e.stopPropagation();
        if (!touchStartX || !touchEndX) return;
        const d = touchStartX - touchEndX;
        if (d > 50) handleNext();
        if (d < -50) handlePrev();
    };

    const confirmOpenGoogleMaps = () => {
        if (pendingMapRoute) {
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${pendingMapRoute.lat},${pendingMapRoute.lon}&travelmode=driving`, "_blank", "noopener,noreferrer");
            setPendingMapRoute(null);
        }
    };

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-zinc-100 dark:bg-[#09090b]">

            <header className="absolute top-0 w-full h-16 md:h-20 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 flex items-center justify-between px-4 md:px-8 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Car className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">VisionPark</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <button onClick={() => navigate("/login")} className="text-xs md:text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none cursor-pointer whitespace-nowrap">
                        Log In
                    </button>
                    <button onClick={() => navigate("/signup")} className="text-[10px] md:text-sm font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl active:scale-95 transition-all outline-none cursor-pointer shadow-md whitespace-nowrap">
                        Sign Up Free
                    </button>
                </div>
            </header>

            <div className="absolute inset-0 z-0 pt-16 md:pt-20">
                <ParkingMap
                    areas={areas}
                    focusedAreaId={focusedAreaId}
                    tileUrl={mapTileUrl}
                    onMarkerClick={handleMarkerClick}
                    userLocation={userLocation}
                />
            </div>

            <div
                className="absolute bottom-6 md:bottom-10 w-full z-[1000] h-[280px] flex items-center justify-center overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <button onClick={handlePrev} className="hidden md:flex absolute left-4 md:left-10 z-50 h-14 w-14 bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-white/10 rounded-full shadow-xl items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer">
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <div className="relative w-full max-w-[340px] h-full flex items-center justify-center">
                    {areas.map((area, index) => {
                        const offset = getOffset(index);
                        const absOffset = Math.abs(offset);
                        const isFocused = offset === 0;
                        return (
                            <div
                                key={area.id}
                                onClick={() => handleMarkerClick(area.id)}
                                className={`absolute w-[85vw] max-w-[340px] rounded-3xl p-5 md:p-6 flex gap-4 md:gap-5 cursor-pointer transition-all duration-200 ease-out ${isFocused
                                    ? "bg-white dark:bg-[#1f1f22] border border-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500"
                                    : "bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-white/10 shadow-xl"
                                    }`}
                                style={{
                                    transform: `translate3d(calc(${offset * 100}% + ${offset * 20}px), 0, 0) scale(${isFocused ? 1 : 0.85})`,
                                    zIndex: 50 - absOffset,
                                    opacity: absOffset > 1 ? 0 : isFocused ? 1 : 0.7,
                                    pointerEvents: absOffset > 1 ? "none" : "auto",
                                    willChange: "transform",
                                }}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    <Building2 className={`h-6 w-6 md:h-7 md:w-7 ${isFocused ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                                </div>
                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className={`font-bold text-lg md:text-xl leading-tight mb-2 truncate ${isFocused ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                                        {area.name}
                                    </h3>
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{area.price.toFixed(1)} ETB / Hr</span>
                                        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-sm">
                                            <span className="text-emerald-500 font-bold">P</span> {area.availableSpaces} Spots
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-4 text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">
                                        <Compass className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="truncate">{area.distance?.toFixed(2)} Km from you</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPendingMapRoute({ lat: area.lat, lon: area.lon, name: area.name }); }}
                                            className="h-10 w-12 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-90 transition-all outline-none cursor-pointer shrink-0"
                                        >
                                            <Navigation className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFocusedAreaId(area.id); setShowAuthModal(true); }}
                                            className="flex-1 h-10 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm hover:bg-emerald-400 active:scale-95 transition-all outline-none cursor-pointer shadow-md shadow-emerald-500/20"
                                        >
                                            Reserve Spot
                                        </button>
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

            {showAuthModal && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowAuthModal(false)}>
                    <div className="w-full max-w-md bg-white dark:bg-[#121214] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 md:p-8 flex flex-col items-center text-center relative">
                            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>

                            <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                <Car className="h-8 w-8 text-emerald-500" strokeWidth={2} />
                            </div>

                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Ready to Park?</h2>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed px-2">
                                Create a free VisionPark account to instantly secure spots, get digital receipts, and track your parking time live.
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => navigate("/signup")}
                                    className="w-full py-3.5 md:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
                                >
                                    <UserPlus className="h-5 w-5 shrink-0" /> Sign Up & Reserve
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="w-full py-3.5 md:py-4 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-bold active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer border border-zinc-200 dark:border-white/5 text-sm md:text-base"
                                >
                                    <LogIn className="h-5 w-5 shrink-0" /> I already have an account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {pendingMapRoute && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPendingMapRoute(null)}>
                    <div className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Navigation className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-xl text-zinc-900 dark:text-white mb-2">Leaving VisionPark</h3>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">
                                You are about to leave the VisionPark app to open Google Maps for directions to <strong className="text-zinc-900 dark:text-zinc-300">{pendingMapRoute.name}</strong>. Do you want to continue?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPendingMapRoute(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 transition-colors outline-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmOpenGoogleMaps}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all outline-none cursor-pointer flex items-center justify-center gap-2"
                                >
                                    Open Maps <ExternalLink className="h-4 w-4 shrink-0" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}