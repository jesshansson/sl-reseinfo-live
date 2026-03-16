import { NavLink, Outlet } from "react-router-dom";
import { Train, AlertTriangle, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDeviations } from "@/lib/sl-api";

export default function AppLayout() {
  const { data: deviations = [] } = useQuery({
    queryKey: ["deviations", []],
    queryFn: () => fetchDeviations({}),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const highSeverityCount = deviations.filter(
    (d) => (d.priority?.importance_level ?? 0) >= 4
  ).length;

  const navItems = [
    { to: "/", label: "Avgångar", icon: Train, badge: 0 },
    { to: "/disruptions", label: "Störningar", icon: AlertTriangle, badge: highSeverityCount },
    { to: "/trip", label: "Reseplanerare", icon: Navigation, badge: 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-header text-primary-foreground">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
  <Train className="h-7 w-7" />
  <h1 className="text-xl font-bold tracking-tight">SL Realtid</h1>
</NavLink>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
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