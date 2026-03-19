import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
    Activity, Server, Wifi, WifiOff, AlertTriangle,
    Search, CheckCircle, MapPin, X, Camera,
    RefreshCw, Wrench, CheckCircle2, Image
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// --- MOCK EDGE AI NODE DATA (NATIONWIDE) ---
const INITIAL_NODES = [
    { id: "NODE-AA-01", name: "Bole Premium Cam-A", city: "Addis Ababa", lat: 8.9806, lon: 38.7997, status: "Online", ping: "12ms", uptime: "99.9%", ip: "192.168.1.101", model: "YOLOv8n" },
    { id: "NODE-AA-02", name: "Piazza Central Cam-1", city: "Addis Ababa", lat: 9.0312, lon: 38.7521, status: "Warning", ping: "350ms", uptime: "94.2%", ip: "192.168.1.105", model: "YOLOv8s" },
    { id: "NODE-AA-03", name: "Meskel Square Hub", city: "Addis Ababa", lat: 9.0104, lon: 38.7611, status: "Online", ping: "18ms", uptime: "99.8%", ip: "192.168.1.108", model: "YOLOv8n" },
    { id: "NODE-DD-01", name: "Dire Dawa Market Secure", city: "Dire Dawa", lat: 9.5931, lon: 41.8561, status: "Offline", ping: "--", uptime: "82.4%", ip: "10.0.4.50", model: "YOLOv8n" },
    { id: "NODE-OR-01", name: "Adama Terminal Entry", city: "Adama", lat: 8.5410, lon: 39.2689, status: "Online", ping: "28ms", uptime: "99.1%", ip: "10.0.5.12", model: "YOLOv8n" },
    { id: "NODE-SI-01", name: "Hawassa Park Entry", city: "Hawassa", lat: 7.0504, lon: 38.4682, status: "Online", ping: "45ms", uptime: "98.7%", ip: "10.0.6.22", model: "YOLOv8n" }
];

const ETHIOPIA_CENTER = [9.1450, 40.4897];

// ─── CUSTOM MAP ICONS ────────────────────────────────────────────────────────
const createNodeIcon = (status, isFocused) => {
    let colorClass = "bg-emerald-500 border-emerald-300";
    let shadowClass = "shadow-[0_0_15px_rgba(16,185,129,0.6)]";
    let pulseClass = "";

    if (status === "Warning") {
        colorClass = "bg-amber-500 border-amber-300";
        shadowClass = "shadow-[0_0_15px_rgba(245,158,11,0.6)]";
    } else if (status === "Offline") {
        colorClass = "bg-red-500 border-red-300";
        shadowClass = "shadow-[0_0_15px_rgba(239,68,68,0.8)]";
        pulseClass = "animate-ping opacity-75";
    }

    const scale = isFocused ? "scale-125 z-50 ring-4 ring-indigo-500" : "scale-100 hover:scale-110";

    return L.divIcon({
        className: "custom-node-marker",
        html: `<div class="relative flex h-8 w-8 items-center justify-center">
            ${status === 'Offline' ? `<div class="absolute inset-0 rounded-full ${colorClass} ${pulseClass}"></div>` : ''}
            <div class="h-5 w-5 rounded-full ${colorClass} border-2 ${shadowClass} ${scale} transition-all duration-300 z-10 flex items-center justify-center"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

// ─── STABLE MAP CAMERA CONTROLLER ────────────────────────────────────────────
function MapCamera({ center, zoom, trigger }) {
    const map = useMap();
    useEffect(() => {
        if (trigger > 0) {
            map.setView(center, zoom, { animate: true, duration: 0.8 });
        }
    }, [center, zoom, trigger, map]);
    return null;
}

// ─── MEMOIZED LEAFLET MAP ────────────────────────────────────────────────────
// FIX: passes ALL filtered nodes (not just the focused one) so spatial context
// is preserved on the map — admin can still see healthy nodes nearby an offline one.
const NetworkMap = memo(({ nodes, focusedNodeId, mapViewState, tileUrl, onMarkerClick }) => {
    return (
        <MapContainer
            center={ETHIOPIA_CENTER}
            zoom={6}
            zoomControl={false}
            preferCanvas={true}
            scrollWheelZoom={true}
            className="h-full w-full outline-none bg-zinc-100 dark:bg-[#09090b]"
        >
            <TileLayer url={tileUrl} detectRetina={true} keepBuffer={4} />

            {nodes.map((node) => (
                <Marker
                    key={node.id}
                    position={[node.lat, node.lon]}
                    icon={createNodeIcon(node.status, node.id === focusedNodeId)}
                    eventHandlers={{ click: () => onMarkerClick(node.id) }}
                    zIndexOffset={node.id === focusedNodeId ? 1000 : 0}
                />
            ))}

            <MapCamera
                center={mapViewState.center}
                zoom={mapViewState.zoom}
                trigger={mapViewState.trigger}
            />
        </MapContainer>
    );
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function NetworkHealth() {
    const { theme } = useTheme();
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("All");
    const [focusedNodeId, setFocusedNodeId] = useState(null);
    const [mapViewState, setMapViewState] = useState({ center: ETHIOPIA_CENTER, zoom: 6, trigger: 0 });

    // --- ACTION STATES ---
    // Tracks per-node loading/success states for the two backend-driven actions.
    // These never require OS/shell access — both are simple API calls:
    //   Re-poll  → POST /admin/nodes/:id/repoll  (backend pings the edge node immediately)
    //   Maintain → PATCH /admin/nodes/:id/status  { status: "Maintenance" }
    const [repollState, setRepollState] = useState({}); // { [nodeId]: "idle" | "loading" | "done" }
    const [maintainState, setMaintainState] = useState({}); // { [nodeId]: "idle" | "loading" | "done" }
    const [snapshotState, setSnapshotState] = useState({}); // { [nodeId]: "idle" | "loading" | "done" }

    const stats = {
        total: nodes.length,
        online: nodes.filter(n => n.status === "Online").length,
        warning: nodes.filter(n => n.status === "Warning").length,
        offline: nodes.filter(n => n.status === "Offline").length,
    };

    const filteredNodes = nodes.filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "All" || n.status === filter;
        return matchesSearch && matchesFilter;
    });

    const activeNode = nodes.find(n => n.id === focusedNodeId);
    const needsAction = activeNode && (activeNode.status === "Offline" || activeNode.status === "Warning");

    const mapTileUrl = useMemo(() =>
        theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        [theme]);

    const handleMarkerClick = useCallback((nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setFocusedNodeId(nodeId);
            setMapViewState({ center: [node.lat, node.lon], zoom: 15, trigger: Date.now() });
        }
    }, [nodes]);

    const handleResetMap = () => {
        setFocusedNodeId(null);
        setMapViewState({ center: ETHIOPIA_CENTER, zoom: 6, trigger: Date.now() });
    };

    // FIX: Scroll focused card into view
    useEffect(() => {
        if (focusedNodeId) {
            const cardElement = document.getElementById(`node-card-${focusedNodeId}`);
            if (cardElement) cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [focusedNodeId]);

    // --- ACTION HANDLERS ---

    // Tells the backend to immediately re-poll this node's heartbeat.
    // Web-safe: this is a POST to our own API, not a system ping command.
    const handleRepoll = (nodeId) => {
        setRepollState(s => ({ ...s, [nodeId]: "loading" }));
        // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
        // await api.post(`/admin/nodes/${nodeId}/repoll`);
        setTimeout(() => {
            setRepollState(s => ({ ...s, [nodeId]: "done" }));
            // Simulate backend returning a refreshed status
            setNodes(prev => prev.map(n =>
                n.id === nodeId ? { ...n, status: "Warning", ping: "480ms" } : n
            ));
            setTimeout(() => setRepollState(s => ({ ...s, [nodeId]: "idle" })), 3000);
        }, 2000);
    };

    // Sets the node's status to "Maintenance" in the database.
    // Exempts it from offline alerts while physical servicing happens.
    const handleFlagMaintenance = (nodeId) => {
        setMaintainState(s => ({ ...s, [nodeId]: "loading" }));
        // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
        // await api.patch(`/admin/nodes/${nodeId}/status`, { status: "Maintenance" });
        setTimeout(() => {
            setMaintainState(s => ({ ...s, [nodeId]: "done" }));
            setNodes(prev => prev.map(n =>
                n.id === nodeId ? { ...n, status: "Maintenance" } : n
            ));
        }, 1500);
    };

    // Requests the last successfully captured frame from the backend.
    // Web-safe: backend serves the stored image via a standard GET endpoint.
    const handleViewSnapshot = (nodeId) => {
        setSnapshotState(s => ({ ...s, [nodeId]: "loading" }));
        // 🛑 TEAMS: REPLACE WITH ACTUAL API CALL 🛑
        // const { imageUrl } = await api.get(`/admin/nodes/${nodeId}/last-snapshot`);
        // window.open(imageUrl, "_blank");
        setTimeout(() => {
            setSnapshotState(s => ({ ...s, [nodeId]: "done" }));
            setTimeout(() => setSnapshotState(s => ({ ...s, [nodeId]: "idle" })), 3000);
        }, 1500);
    };

    // --- STATUS STYLE HELPERS ---
    const getStatusColor = (status) => {
        if (status === "Offline") return "text-red-500";
        if (status === "Warning") return "text-amber-500";
        if (status === "Maintenance") return "text-violet-500";
        return "text-emerald-500";
    };

    const getPingColor = (status) => {
        if (status === "Offline") return "text-red-500";
        if (status === "Warning") return "text-amber-500";
        return "text-zinc-900 dark:text-white";
    };

    return (
        <div className="h-[calc(100vh-140px)] w-full flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 relative pb-4 md:pb-0 min-h-[800px] xl:min-h-0">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" /> Network Health
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live ping, uptime, and edge AI diagnostics.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full md:w-auto">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 shadow-sm shrink-0">
                        <CheckCircle className="h-4 w-4" /> {stats.online} Online
                    </span>
                    {stats.warning > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-500/20 shadow-sm shrink-0">
                            <AlertTriangle className="h-4 w-4" /> {stats.warning} Warning
                        </span>
                    )}
                    {stats.offline > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-500/20 shadow-sm shrink-0">
                            <AlertTriangle className="h-4 w-4 animate-pulse" /> {stats.offline} Offline
                        </span>
                    )}
                </div>
            </div>

            {/* MAIN SPLIT VIEW
                Wrapped in a relative container so the detail card can be absolutely
                positioned over the map on xl without being clipped by the map's
                overflow-hidden. On mobile the card renders as a fixed bottom sheet
                at the viewport level instead. */}
            <div className="relative flex flex-col xl:flex-row gap-4 md:gap-6 flex-1 min-h-0">

                {/* LEFT: NODE LIST */}
                <div className="w-full xl:w-[400px] h-[350px] xl:h-full bg-white dark:bg-[#121214] rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5 flex flex-col shrink-0 overflow-hidden order-2 xl:order-1">

                    <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#18181b] shrink-0 space-y-3">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search camera or lot..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl text-xs font-bold bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-black/40 p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-x-auto custom-scrollbar">
                            {["All", "Online", "Warning", "Offline"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all outline-none text-center whitespace-nowrap ${filter === f
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-zinc-50/50 dark:bg-[#09090b] scroll-smooth">
                        {filteredNodes.map(node => {
                            const isFocused = focusedNodeId === node.id;
                            const isOffline = node.status === "Offline";
                            const isWarning = node.status === "Warning";
                            const isMaintenance = node.status === "Maintenance";

                            return (
                                <div
                                    key={node.id}
                                    id={`node-card-${node.id}`}
                                    onClick={() => handleMarkerClick(node.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none outline-none ${isFocused
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-md'
                                        : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Server className={`h-4 w-4 shrink-0 ${isOffline ? 'text-red-500' : isWarning ? 'text-amber-500' : isMaintenance ? 'text-violet-500' : 'text-emerald-500'}`} />
                                            <h4 className={`text-sm font-bold truncate ${isFocused ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-white'}`}>{node.name}</h4>
                                        </div>
                                        {isOffline
                                            ? <WifiOff className="h-4 w-4 text-red-500 shrink-0" />
                                            : <Wifi className={`h-4 w-4 shrink-0 ${isWarning ? 'text-amber-500' : isMaintenance ? 'text-violet-500' : 'text-emerald-500'}`} />
                                        }
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Ping</p>
                                            <p className={`text-xs font-mono font-bold ${getPingColor(node.status)}`}>{node.ping}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Uptime</p>
                                            <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{node.uptime}</p>
                                        </div>
                                    </div>
                                    {/* Maintenance badge */}
                                    {isMaintenance && (
                                        <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 w-fit">
                                            <Wrench className="h-3 w-3 text-violet-500" />
                                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Under Maintenance</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: MAP
                    overflow-hidden is required for rounded-3xl clipping.
                    Attribution is pushed inward via CSS so it never hides
                    behind the rounded frame corners. */}
                <style>{`
                    .leaflet-control-attribution {
                        margin-bottom: 10px !important;
                        margin-right: 10px !important;
                        background: rgba(255,255,255,0.88) !important;
                        border-radius: 8px !important;
                        padding: 2px 8px !important;
                        font-size: 10px !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
                        color: #52525b !important;
                        max-width: 260px !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }
                    .dark .leaflet-control-attribution {
                        background: rgba(18,18,20,0.92) !important;
                        color: #a1a1aa !important;
                    }
                    .leaflet-control-attribution a {
                        color: #4f46e5 !important;
                        font-weight: 600;
                    }
                    .leaflet-bottom.leaflet-right {
                        margin-bottom: 4px;
                        margin-right: 4px;
                    }
                `}</style>
                <div className="flex-1 relative rounded-3xl overflow-hidden shadow-sm border border-zinc-200 dark:border-white/5 z-0 isolate min-h-[350px] xl:h-auto order-1 xl:order-2">

                    {focusedNodeId && (
                        <button
                            onClick={handleResetMap}
                            className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border border-zinc-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 dark:text-white shadow-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors outline-none cursor-pointer flex items-center gap-2"
                        >
                            <MapPin className="h-4 w-4 text-indigo-500" /> View National Map
                        </button>
                    )}

                    {/* FIX: Pass filteredNodes (all of them), not mapDisplayNodes.
                        All markers stay visible for spatial context.
                        The focused node is elevated via zIndexOffset + icon scaling. */}
                    <NetworkMap
                        nodes={filteredNodes}
                        focusedNodeId={focusedNodeId}
                        mapViewState={mapViewState}
                        tileUrl={mapTileUrl}
                        onMarkerClick={handleMarkerClick}
                    />

                </div>
            </div>

            {/* ── NODE DETAIL CARD via createPortal ─────────────────────────────────
                Mounted into document.body so it is never a descendant of the
                map's overflow-hidden container and can never be clipped by it.
                No z-index adjustment needed — portal siblings of the app root
                naturally paint above the rest of the page.

                Mobile / sm / md / lg  (< xl):
                  - Full-viewport fixed backdrop with backdrop-blur dims the page.
                  - Card is centered both horizontally AND vertically as a modal.
                  - Tapping the backdrop dismisses it.

                Desktop (xl+):
                  - Backdrop hidden.
                  - Card fixed bottom-right, visually floating over the map corner.
            ──────────────────────────────────────────────────────────────────── */}
            {activeNode && createPortal(
                <>
                    {/* Backdrop — visible only below xl breakpoint.
                        Blurs and dims everything beneath the centered modal. */}
                    <div
                        onClick={handleResetMap}
                        className="xl:hidden fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    />

                    {/* Card
                        < xl  : fixed, centered on screen (top-1/2 + -translate-y-1/2),
                                mx-4 keeps it off the screen edges, max-w-sm caps width.
                        xl+   : fixed, bottom-right anchor, fixed width 340px.        */}
                    <div className="
                        fixed
                        left-4 right-4 top-1/2 -translate-y-1/2
                        xl:inset-auto xl:translate-y-0 xl:bottom-8 xl:right-8 xl:left-auto xl:w-[340px]
                        bg-white dark:bg-[#121214]
                        border border-zinc-200 dark:border-white/10
                        rounded-3xl
                        shadow-2xl
                        p-4 md:p-5
                        animate-in fade-in zoom-in-95 duration-300
                        max-h-[85dvh] overflow-y-auto custom-scrollbar
                        max-w-sm mx-auto xl:max-w-none xl:mx-0
                    ">

                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4 border-b border-zinc-100 dark:border-white/5 pb-4">
                            <div className="min-w-0 pr-2">
                                <h3 className="font-black text-base md:text-lg text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                                    <Camera className="h-4 w-4 md:h-5 md:w-5 text-indigo-500 shrink-0" /> {activeNode.id}
                                </h3>
                                <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 truncate">{activeNode.city}</p>
                            </div>
                            <button onClick={handleResetMap} className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer shrink-0">
                                <X className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                        </div>

                        {/* Node diagnostics — all five fields */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="font-medium text-zinc-500">Status</span>
                                <span className={`font-bold ${getStatusColor(activeNode.status)}`}>{activeNode.status}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="font-medium text-zinc-500">Ping</span>
                                <span className={`font-mono font-bold ${getPingColor(activeNode.status)}`}>{activeNode.ping}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="font-medium text-zinc-500">Uptime</span>
                                <span className="font-mono font-bold text-zinc-900 dark:text-white">{activeNode.uptime}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="font-medium text-zinc-500">IP Address</span>
                                <span className="font-mono font-bold text-zinc-900 dark:text-white">{activeNode.ip}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="font-medium text-zinc-500">AI Model</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">{activeNode.model}</span>
                            </div>
                        </div>

                        {/* Action buttons — Offline and Warning nodes only */}
                        {needsAction && activeNode.status !== "Maintenance" && (
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex flex-col gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Admin Actions</p>

                                {/* Request Re-poll: POST to backend — web-safe, no OS ping */}
                                <button
                                    onClick={() => handleRepoll(activeNode.id)}
                                    disabled={repollState[activeNode.id] === "loading" || repollState[activeNode.id] === "done"}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer
                                        ${repollState[activeNode.id] === "done"
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {repollState[activeNode.id] === "loading" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        : repollState[activeNode.id] === "done" ? <CheckCircle2 className="h-3.5 w-3.5" />
                                            : <RefreshCw className="h-3.5 w-3.5" />}
                                    {repollState[activeNode.id] === "loading" ? "Requesting Re-poll..."
                                        : repollState[activeNode.id] === "done" ? "Re-poll Requested"
                                            : "Request Re-poll"}
                                </button>

                                {/* View Last Snapshot: GET from backend storage — web-safe */}
                                <button
                                    onClick={() => handleViewSnapshot(activeNode.id)}
                                    disabled={snapshotState[activeNode.id] === "loading" || snapshotState[activeNode.id] === "done"}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer
                                        ${snapshotState[activeNode.id] === "done"
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {snapshotState[activeNode.id] === "loading" ? <Image className="h-3.5 w-3.5 animate-pulse" />
                                        : snapshotState[activeNode.id] === "done" ? <CheckCircle2 className="h-3.5 w-3.5" />
                                            : <Image className="h-3.5 w-3.5" />}
                                    {snapshotState[activeNode.id] === "loading" ? "Fetching Snapshot..."
                                        : snapshotState[activeNode.id] === "done" ? "Snapshot Opened"
                                            : "View Last Snapshot"}
                                </button>

                                {/* Flag for Maintenance: PATCH status in database — web-safe */}
                                <button
                                    onClick={() => handleFlagMaintenance(activeNode.id)}
                                    disabled={maintainState[activeNode.id] === "loading" || maintainState[activeNode.id] === "done"}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer
                                        ${maintainState[activeNode.id] === "done"
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {maintainState[activeNode.id] === "loading" ? <Wrench className="h-3.5 w-3.5 animate-pulse" />
                                        : maintainState[activeNode.id] === "done" ? <CheckCircle2 className="h-3.5 w-3.5" />
                                            : <Wrench className="h-3.5 w-3.5" />}
                                    {maintainState[activeNode.id] === "loading" ? "Flagging..."
                                        : maintainState[activeNode.id] === "done" ? "Flagged for Maintenance"
                                            : "Flag for Maintenance"}
                                </button>
                            </div>
                        )}

                        {/* Maintenance already active notice */}
                        {activeNode.status === "Maintenance" && (
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                                <Wrench className="h-4 w-4 text-violet-500 shrink-0" />
                                <p className="text-xs font-bold text-violet-700 dark:text-violet-300">This node is under maintenance. Offline alerts are suppressed.</p>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
            {/* Scrollbar styles live in global index.css — no inline style block needed */}
        </div>
    );
}