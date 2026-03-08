import { NavLink, Outlet } from "react-router-dom";
import { Train, AlertTriangle, Navigation } from "lucide-react";

const navItems = [
  { to: "/", label: "Avgångar", icon: Train },
  { to: "/disruptions", label: "Störningar", icon: AlertTriangle },
  { to: "/trip", label: "Reseplanerare", icon: Navigation },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-header text-primary-foreground">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Train className="h-7 w-7" />
            <h1 className="text-xl font-bold tracking-tight">SL Realtid</h1>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        Data från SL &middot; Trafiklab
      </footer>
    </div>
  );
}
