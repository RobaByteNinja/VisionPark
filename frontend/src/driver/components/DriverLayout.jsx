import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Map, Timer, Clock, User } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ScrollProvider } from "../../context/ScrollContext";

function LayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/driver/map", icon: Map, label: "Map" },
    { path: "/driver/session", icon: Timer, label: "Session" },
    { path: "/driver/history", icon: Clock, label: "History" },
    { path: "/driver/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      <Header />

      {/* Main content area – hidden overflow prevents any page from scrolling */}
      <main className="flex-1 w-full overflow-hidden">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe">
        <div className="mx-auto w-full max-w-md px-4 pb-4 pt-2">
          <div className="flex items-center justify-around rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-2xl dark:shadow-black/80 px-2 py-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-1 w-16 transition-all duration-300 cursor-pointer
                    ${isActive 
                      ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-110" 
                      : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:scale-105"}
                  `}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default function DriverLayout() {
  return (
    <ScrollProvider>
      <div className="relative h-screen w-full flex flex-col bg-[#f4f4f5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
        <LayoutContent />
      </div>
    </ScrollProvider>
  );
}