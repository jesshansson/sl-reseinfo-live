import { getTransportModeColor, getTransportModeLabel, formatTime, getMinutesUntil, type Departure } from "@/lib/sl-api";
import { Clock } from "lucide-react";

interface DepartureBoardProps {
  departures: Departure[];
  loading?: boolean;
}

function TransportBadge({ mode, designation }: { mode: string; designation: string }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded text-xs font-bold text-primary-foreground ${getTransportModeColor(mode)}`}>
      {designation}
    </span>
  );
}

function TimeDisplay({ expected, scheduled }: { expected?: string; scheduled?: string }) {
  const minutes = getMinutesUntil(expected || scheduled);
  const isDelayed = expected && scheduled && new Date(expected) > new Date(scheduled);

  if (minutes === null) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="text-right">
      <div className={`text-sm font-bold ${minutes <= 0 ? "text-train" : isDelayed ? "text-severity-medium" : "text-foreground"}`}>
        {minutes <= 0 ? "Nu" : `${minutes} min`}
      </div>
      <div className="text-xs text-muted-foreground">
        {formatTime(expected || scheduled)}
        {isDelayed && scheduled && (
          <span className="line-through ml-1">{formatTime(scheduled)}</span>
        )}
      </div>
    </div>
  );
}

export default function DepartureBoard({ departures, loading }: DepartureBoardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 shadow-card animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (!departures.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>Inga avgångar hittades</p>
      </div>
    );
  }

  // Group by transport mode
  const grouped = departures.reduce<Record<string, Departure[]>>((acc, dep) => {
    const mode = dep.line.transport_mode;
    if (!acc[mode]) acc[mode] = [];
    acc[mode].push(dep);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([mode, deps]) => (
        <div key={mode}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {getTransportModeLabel(mode)}
          </h3>
          <div className="space-y-1">
            {deps.slice(0, 15).map((dep, i) => (
              <div
                key={`${dep.journey.id}-${i}`}
                className="bg-card rounded-lg px-4 py-3 shadow-card flex items-center gap-3"
              >
                <TransportBadge mode={dep.line.transport_mode} designation={dep.line.designation} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{dep.destination}</p>
                  {dep.stop_point?.designation && (
                    <p className="text-xs text-muted-foreground">
                      Läge {dep.stop_point.designation}
                    </p>
                  )}
                </div>
                {dep.deviations && dep.deviations.length > 0 && (
                  <span className="text-severity-medium text-xs">⚠</span>
                )}
                <TimeDisplay expected={dep.expected} scheduled={dep.scheduled} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
