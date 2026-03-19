import React from "react";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * AdminHeader — used on the admin login page only.
 * No theme toggle — the login page always uses the browser default theme.
 * Once logged in, AdminLayout provides its own top bar with theme controls.
 */
export function AdminHeader() {
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 z-[5000] px-4 md:px-8 flex items-center transition-colors duration-500">
            <div
                className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                onClick={() => navigate("/admin/login")}
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                    <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-white tracking-wide text-base sm:text-lg">
                    VisionPark <span className="text-indigo-500">Admin</span>
                </span>
            </div>
        </header>
    );
}