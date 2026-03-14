import { Outlet, Link } from "react-router-dom"
import { LayoutDashboard, Users, Settings, Car, Menu } from "lucide-react"
import { ThemeToggle } from "../ui/theme-toggle"

export default function OwnerLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (Hidden on mobile, block on large screens) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/40 bg-card h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <span className="text-lg font-bold tracking-tight">VisionPark Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/owner/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link to="/owner/staff" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors">
            <Users className="h-5 w-5" /> Staff Management
          </Link>
          <Link to="/owner/zones" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors">
            <Car className="h-5 w-5" /> Zone Config
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/40 bg-background/95 backdrop-blur flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-xs font-bold text-primary">OW</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}