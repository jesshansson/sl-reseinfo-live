import { useQuery } from "@tanstack/react-query";
import { fetchDepartures, formatTime, getMinutesUntil, getTransportModeColor, type Site } from "@/lib/sl-api";
import { Star, ChevronRight, AlertTriangle } from "lucide-react";

interface FavoriteStationCardProps {
  site: Site;
  onSelect: (site: Site) => void;
  onRemove: (siteId: number) => void;
}

export default function FavoriteStationCard({ site, onSelect, onRemove }: FavoriteStationCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["departures", site.id],
    queryFn: () => fetchDepartures(site.id),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const departures = data?.departures?.slice(0, 4) || [];
  const hasDeviations = (data?.stop_deviations?.length ?? 0) > 0 ||
    departures.some((d) => d.deviations && d.deviations.length > 0);

  // Check if any departure is delayed
  const hasDelays = departures.some((d) => {
    if (!d.expected || !d.scheduled) return false;
    return new Date(d.expected) > new Date(d.scheduled);
  });

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border/50 hover:shadow-elevated transition-shadow">
      <button
        className="w-full text-left"
        onClick={() => onSelect(site)}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {(hasDeviations || hasDelays) && (
              <AlertTriangle className="h-4 w-4 text-severity-medium shrink-0" />
            )}
            <h4 className="font-semibold text-sm truncate">{site.name}</h4>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(site.id);
              }}
              className="p-1 hover:bg-secondary rounded transition-colors"
              title="Ta bort favorit"
            >
              <Star className="h-4 w-4 fill-accent text-accent" />
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 pb-3 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : departures.length === 0 ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">Inga avgångar</p>
          </div>
        ) : (
          <div className="px-4 pb-3 space-y-1">
            {departures.map((dep, i) => {
              const minutes = getMinutesUntil(dep.expected || dep.scheduled);
              const isDelayed = dep.expected && dep.scheduled && new Date(dep.expected) > new Date(dep.scheduled);
              return (
                <div key={`${dep.journey.id}-${i}`} className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex items-center justify-center min-w-[2.2rem] px-1 py-0.5 rounded text-[10px] font-bold text-primary-foreground ${getTransportModeColor(dep.line.transport_mode)}`}>
                    {dep.line.designation}
                  </span>
                  <span className="truncate flex-1 text-muted-foreground">{dep.destination}</span>
                  <span className={`font-semibold shrink-0 ${
                    minutes !== null && minutes <= 0
                      ? "text-train"
                      : isDelayed
                        ? "text-severity-medium"
                        : "text-foreground"
                  }`}>
                    {minutes !== null && minutes <= 0 ? "Nu" : `${minutes} min`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </button>

      {data?.stop_deviations && data.stop_deviations.length > 0 && (
        <div className="px-4 pb-3 border-t border-border/50">
          {data.stop_deviations.slice(0, 1).map((d, i) => (
            <p key={i} className="text-[10px] text-severity-medium mt-1.5 line-clamp-2">⚠ {d.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
