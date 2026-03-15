import { Outlet, Link } from "react-router-dom"
import { LogOut, ShieldAlert } from "lucide-react"
import { ThemeToggle } from "../../components/ui/theme-toggle"

export default function AttendantLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Strict Top Bar for Tablet */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card px-4 md:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-sm font-bold leading-none">Patrol Terminal</h1>
            <p className="text-xs text-muted-foreground mt-1">Guard on duty: G-4092</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {/* Replaces standard profile with strict sign-out */}
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-destructive hover:text-destructive/80 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign Out</span>
          </Link>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="flex-1 p-4 md:p-6 bg-secondary/20">
        <Outlet />
      </main>
    </div>
  )
}