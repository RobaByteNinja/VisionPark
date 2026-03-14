import { Outlet } from "react-router-dom"
import { ThemeToggle } from "../ui/theme-toggle"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">
      {/* Top Bar for Public Pages */}
      <header className="absolute top-0 w-full p-4 flex justify-end z-50">
        <ThemeToggle />
      </header>
      
      {/* The Page Content (Login, Register, etc.) */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}