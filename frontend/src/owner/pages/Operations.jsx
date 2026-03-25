import React, { useState, useEffect } from "react";
import {
  Cctv, AlertTriangle, FileText, ShieldAlert,
  CheckCircle, Clock, Maximize2, Video,
  Activity, MapPin, ChevronRight, Share, Radar
} from "lucide-react";

const CAMERA_BRANCHES = [
  {
    id: "br_01", name: "Adama Bus Terminal Parking", status: "Live",
    cameras: [{ id: "cam_1", name: "Main Gate Camera", zone: "Entry/Exit", status: "Live" }]
  },
  {
    id: "br_02", name: "Bole Airport Parking", status: "Live",
    cameras: [
      { id: "cam_2", name: "Terminal A Entry", zone: "Zone A", status: "Live" },
      { id: "cam_3", name: "Terminal B Exit", zone: "Zone B", status: "Live" },
      { id: "cam_4", name: "Premium Lot", zone: "VIP", status: "Offline" }
    ]
  },
  {
    id: "br_03", name: "Piazza Street Parking", status: "Offline",
    cameras: [{ id: "cam_5", name: "Street View 1", zone: "Street Level", status: "Offline" }]
  }
];

const SYSTEM_ALERTS = [
  { id: 1, type: "Camera Offline", branch: "Piazza Street Parking", camera: "Street View 1", time: "10 mins ago", status: "Active" },
  { id: 2, type: "Vehicle Overstay", branch: "Adama Bus Terminal", camera: "N/A", time: "25 mins ago", status: "Active" },
  { id: 3, type: "Capacity Near Full", branch: "Bole Airport Parking", camera: "N/A", time: "1 hour ago", status: "Acknowledged" },
  { id: 4, type: "LPR Mismatch", branch: "Bole Airport Parking", camera: "Terminal A Entry", time: "2 hours ago", status: "Resolved" },
];

const STATIC_INCIDENTS = [
  {
    id: "inc_001", branch: "Bole Airport Parking", zone: "Zone A", spot: "A12",
    date: "2026-03-10 14:30", plates: ["AA-12345", "OR-98765"], category: "Property Damage",
    description: "Minor collision while reversing out of spot A12.",
    attendantName: "Kebede Alemu", attendantId: "1234 5678 9012 3456",
    status: "Pending", hasVideo: true
  },
  {
    id: "inc_002", branch: "Piazza Street Parking", zone: "Street Level", spot: "S05",
    date: "2026-03-09 09:15", plates: ["DR-55521"], category: "Dispute",
    description: "Driver refused to pay overstay penalty of 105 ETB.",
    attendantName: "Sara Tadesse", attendantId: "9876 5432 1098 7654",
    status: "Forwarded to Authority", hasVideo: false
  }
];

export default function Operations() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [incidents, setIncidents] = useState(STATIC_INCIDENTS);
  const [debtRadar, setDebtRadar] = useState([]);

  // ✅ Pull incidents logged by attendants from localStorage
  useEffect(() => {
    const loadReports = () => {
      try {
        const ownerRaw = localStorage.getItem("vp_owner_incidents");
        const debtRaw = localStorage.getItem("vp_debt_radar");

        if (ownerRaw) {
          const parsedOwner = JSON.parse(ownerRaw);
          setIncidents([...parsedOwner, ...STATIC_INCIDENTS]);
        } else {
          setIncidents(STATIC_INCIDENTS);
        }

        if (debtRaw) {
          setDebtRadar(JSON.parse(debtRaw));
        } else {
          setDebtRadar([]);
        }
      } catch (err) {
        console.error("Error loading incidents:", err);
      }
    };

    loadReports();

    // Listen for storage events (if testing across multiple browser tabs)
    window.addEventListener("storage", loadReports);
    return () => window.removeEventListener("storage", loadReports);
  }, [activeTab]);

  const handleMarkResolved = (id) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: "Resolved" } : i));
  };

  const handleForward = (id) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: "Forwarded to Authority" } : i));
  };

  // ── Live Matrix ────────────────────────────────────────────────────────────
  const renderLiveMatrix = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {CAMERA_BRANCHES.map((branch) => {
        const isExpanded = expandedBranch === branch.id;
        const hasMultiple = branch.cameras.length > 1;
        return (
          <div key={branch.id} className={`bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'lg:col-span-2 xl:col-span-3' : ''}`}>
            <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/5 cursor-pointer" onClick={() => hasMultiple && setExpandedBranch(isExpanded ? null : branch.id)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${branch.status === 'Live' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                  <Cctv className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    {branch.name}
                    {hasMultiple && <span className="px-2 py-0.5 bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-md text-[10px] uppercase tracking-wider">{branch.cameras.length} Cams</span>}
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <span className={`h-2 w-2 rounded-full ${branch.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    System {branch.status}
                  </p>
                </div>
              </div>
              {hasMultiple && (
                <button type="button" className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors outline-none">
                  {isExpanded ? <ChevronRight className="h-5 w-5 rotate-90 transition-transform" /> : <Maximize2 className="h-5 w-5" />}
                </button>
              )}
            </div>
            <div className={`p-4 grid gap-4 ${isExpanded ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {(isExpanded ? branch.cameras : [branch.cameras[0]]).map(cam => (
                <div key={cam.id} className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden group">
                  {cam.status === 'Live' ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-50 transition-opacity">
                      <Cctv className="h-16 w-16 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 text-red-500">
                      <AlertTriangle className="h-10 w-10 mb-2" />
                      <span className="text-sm font-bold uppercase tracking-wider">Connection Lost</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-white">{cam.name}</span>
                      <span className="text-[10px] text-zinc-300 uppercase tracking-wider block">{cam.zone}</span>
                    </div>
                    {cam.status === 'Live' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> REC
                      </span>
                    )}
                  </div>
                  {cam.status === 'Live' && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        [AI] YOLOv8 Active
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── System Health ──────────────────────────────────────────────────────────
  const renderSystemHealth = () => (
    <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/10 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-white/5">
              <th className="px-6 py-4 font-semibold">Alert Type</th>
              <th className="px-6 py-4 font-semibold">Location / Device</th>
              <th className="px-6 py-4 font-semibold">Time</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {SYSTEM_ALERTS.map(alert => (
              <tr key={alert.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {alert.type.includes('Offline') ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Activity className="h-4 w-4 text-amber-500" />}
                    {alert.type}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 block">{alert.branch}</span>
                  <span className="text-xs text-zinc-500">{alert.camera}</span>
                </td>
                <td className="px-6 py-4 text-zinc-500">{alert.time}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${alert.status === 'Active' ? 'bg-red-100   text-red-700   dark:bg-red-500/20   dark:text-red-400' :
                    alert.status === 'Acknowledged' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-zinc-100  text-zinc-700  dark:bg-white/10     dark:text-zinc-300'
                    }`}>{alert.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {alert.status === 'Active' && <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 outline-none">Acknowledge</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Incidents tab ──────────────────────────────────────────────────────────
  const renderIncidents = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Debt Radar section — only shown when there are fleeing vehicle reports */}
      {debtRadar.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 md:px-6 py-4 border-b border-red-200 dark:border-red-500/20 bg-red-100/50 dark:bg-red-500/10">
            <Radar className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <h3 className="font-black text-red-700 dark:text-red-400 text-sm uppercase tracking-wider">Debt Radar — Global Watchlist</h3>
              <p className="text-[10px] text-red-500/70 mt-0.5">{debtRadar.length} vehicle{debtRadar.length > 1 ? "s" : ""} flagged for fleeing without payment</p>
            </div>
          </div>
          <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 custom-scrollbar">
            {debtRadar.map(inc => (
              <div key={inc.id} className="bg-white dark:bg-black/30 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded tracking-widest truncate">
                    {inc.plate}
                  </span>
                  <span className="text-[10px] font-bold text-red-500 shrink-0">{inc.amount?.toFixed(2)} ETB</span>
                </div>
                {inc.details && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{inc.details}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-red-100 dark:border-red-500/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
                    <Radar className="h-2.5 w-2.5" /> Global Watchlist Active
                  </span>
                  <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {inc.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owner Incidents */}
      <div className="flex flex-col gap-4 custom-scrollbar">
        {incidents.length === 0 && (
          <div className="text-center py-16 text-zinc-400 text-sm font-medium">No incidents reported yet.</div>
        )}
        {incidents.map(inc => (
          <div key={inc.id} className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-wider">{inc.category || inc.type}</span>
                    <span className="text-xs text-zinc-500 font-mono">{inc.id}</span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mt-2 flex-wrap">
                    <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{inc.branch || inc.location || "N/A"} ({inc.zone || "N/A"}, {inc.spot || "N/A"})</span>
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border shrink-0 ${inc.status === 'Pending' || inc.status === 'Pending Review' || inc.status === 'Admin CCTV Review Needed' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30' :
                  inc.status === 'Forwarded to Authority' ? 'bg-blue-50  border-blue-200  text-blue-700  dark:bg-blue-500/10  dark:border-blue-500/30' :
                    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                  }`}>
                  {inc.status}
                </span>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-white/5 p-4 rounded-xl border border-zinc-100 dark:border-white/5 break-words">
                "{inc.description || inc.details}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Date/Time</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{inc.date || inc.time}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Plates Involved</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {inc.plates?.map(p => (
                      <span key={p} className="text-xs font-mono font-bold bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                    {(!inc.plates || inc.plates.length === 0) && (
                      <span className="text-xs font-mono font-bold bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{inc.plate || "UNKNOWN"}</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Reported By</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{inc.attendantName || "Attendant"}</span>
                    {inc.attendantId && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        ID: {inc.attendantId.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions sidebar */}
            <div className="w-full md:w-56 flex flex-col gap-3 shrink-0 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-white/5 pt-4 md:pt-0 md:pl-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</h4>
              {inc.hasVideo || inc.hasPhoto ? (
                <button type="button" className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors outline-none">
                  <Video className="h-4 w-4" /> View Evidence
                </button>
              ) : (
                <span className="text-xs text-zinc-400 italic">No evidence attached</span>
              )}
              {(inc.status === 'Pending' || inc.status === 'Pending Review' || inc.status === 'Admin CCTV Review Needed') && (
                <>
                  <button
                    type="button"
                    onClick={() => handleForward(inc.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 outline-none mt-auto">
                    <Share className="h-4 w-4" /> Forward to Authority
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkResolved(inc.id)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20 outline-none">
                    <CheckCircle className="h-4 w-4" /> Mark Resolved
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Operations Center</h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">Real-time edge AI monitoring and operational workflows.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-200/50 dark:bg-[#121214] rounded-2xl w-full md:w-max border border-zinc-200 dark:border-white/5">
        {[
          { key: "matrix", label: "Live Matrix", Icon: Cctv },
          { key: "health", label: "System Health", Icon: Activity },
          {
            key: "incidents", label: "Incidents", Icon: FileText,
            badge: incidents.filter(i => i.status === "Pending" || i.status === "Pending Review" || i.status === "Admin CCTV Review Needed").length + debtRadar.length
          },
        ].map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 md:flex-none relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${activeTab === key
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
          >
            <Icon className="h-4 w-4" /> {label}
            {badge > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {activeTab === "matrix" && renderLiveMatrix()}
        {activeTab === "health" && renderSystemHealth()}
        {activeTab === "incidents" && renderIncidents()}
      </div>

    </div>
  );
}