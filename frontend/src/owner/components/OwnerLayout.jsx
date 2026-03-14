import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Map, Users, Activity, PieChart,
  BarChart3, Tags, Landmark, User, Menu, 
  X, Bell, ChevronDown, LogOut, Moon, Sun, Car
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ✅ 1. ADDED ANALYTICS MODULE
const NAVIGATION = [
  { name: "Dashboard", path: "/owner/dashboard", icon: LayoutDashboard },
  { name: "Parking Management", path: "/owner/parking", icon: Map },
  { name: "Attendants", path: "/owner/attendants", icon: Users },
  { name: "Operations", path: "/owner/operations", icon: Activity },
  { name: "Analytics", path: "/owner/analytics", icon: PieChart }, // NEW
  { name: "Financial Reports", path: "/owner/finance", icon: BarChart3 },
  { name: "Pricing Settings", path: "/owner/pricing", icon: Tags },
  { name: "Payment & Payout", path: "/owner/payout", icon: Landmark },
  { name: "Profile", path: "/owner/profile", icon: User },
];

const MOCK_OWNER = {
  name: "Abel Tesfaye",
  role: "Parking Owner",
  avatar: "https://i.pravatar.cc/150?u=abel", 
  unreadNotifications: 3
};

export default function OwnerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false); 
  };

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setIsProfileDropdownOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f4f4f5] dark:bg-[#09090b] transition-colors duration-500">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-[#121214] border-r border-zinc-200 dark:border-white/5 shadow-sm z-20">
        <div className="h-20 flex items-center px-8 border-b border-zinc-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">VisionPark <span className="text-emerald-500">Owner</span></span>
          </div>
        </div>

        <div className="flex flex-col items-center py-6 border-b border-zinc-100 dark:border-white/5 shrink-0">
          <img src={MOCK_OWNER.avatar} alt={MOCK_OWNER.name} className="h-16 w-16 rounded-full border-2 border-emerald-500 shadow-sm object-cover" />
          <h3 className="mt-3 font-bold text-zinc-900 dark:text-white">{MOCK_OWNER.name}</h3>
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{MOCK_OWNER.role}</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 hide-scrollbar">
          {NAVIGATION.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer active:scale-[0.98] ${
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-500" : "text-zinc-400"}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[6000] flex">
          <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-3/4 max-w-sm h-full bg-white dark:bg-[#121214] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-white/5">
              <span className="text-lg font-bold text-zinc-900 dark:text-white">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full bg-zinc-50 dark:bg-white/5 outline-none cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-white/5">
              <img src={MOCK_OWNER.avatar} alt={MOCK_OWNER.name} className="h-12 w-12 rounded-full border-2 border-emerald-500 object-cover" />
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">{MOCK_OWNER.name}</h3>
                <span className="text-xs text-zinc-500 font-medium uppercase">{MOCK_OWNER.role}</span>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAVIGATION.map((item) => {
                const isActive = location.pathname.includes(item.path);
                const Icon = item.icon;
                return (
                  <button key={item.name} onClick={() => handleNavigation(item.path)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer ${isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-emerald-500" : "text-zinc-400"}`} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 lg:h-20 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 z-40 shrink-0">
          <div className="flex lg:hidden items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg outline-none cursor-pointer">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center text-white"><Car className="h-4 w-4" /></div>
            </div>
          </div>

          <div className="hidden lg:block"></div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors outline-none cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {MOCK_OWNER.unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#121214]"></span>
              )}
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 p-1 pr-2 md:pr-3 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/10 outline-none cursor-pointer"
              >
                <img src={MOCK_OWNER.avatar} alt="Profile" className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover border border-zinc-200 dark:border-white/10" />
                <span className="hidden md:block text-sm font-bold text-zinc-900 dark:text-white">{MOCK_OWNER.name}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 hidden md:block transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ✅ 2. REMOVED "SETTINGS" FROM DROPDOWN */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[5000]">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{MOCK_OWNER.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{MOCK_OWNER.role}</p>
                  </div>
                  
                  <div className="p-1.5 flex flex-col">
                    <button onClick={() => handleNavigation("/owner/profile")} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left outline-none cursor-pointer">
                      <User className="h-4 w-4" /> View Profile
                    </button>
                    <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left outline-none cursor-pointer">
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-1.5 border-t border-zinc-100 dark:border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-left outline-none cursor-pointer">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain bg-[#f4f4f5] dark:bg-[#09090b]">
          <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
}