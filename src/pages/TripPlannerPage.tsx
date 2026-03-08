import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchTrips, formatTime, type JourneyLocation, type TripSearchParams, type Journey } from "@/lib/sl-api";
import JourneyStopSearch from "@/components/JourneyStopSearch";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Repeat, ChevronDown, ChevronUp, ArrowDownUp, Settings2 } from "lucide-react";

const FILTER_OPTIONS = [
  { key: "inclCommuter", label: "Pendeltåg" },
  { key: "inclMetro", label: "Tunnelbana" },
  { key: "inclTram", label: "Spårvagn" },
  { key: "inclBus", label: "Buss" },
  { key: "inclShip", label: "Båt" },
  { key: "inclTrain", label: "Tåg" },
] as const;

const ROUTE_TYPES = [
  { value: "leasttime" as const, label: "Snabbast" },
  { value: "leastinterchange" as const, label: "Färst byten" },
  { value: "leastwalking" as const, label: "Minst gång" },
];

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} h ${m} min`;
}

function getProductName(productClass?: number): string {
  const map: Record<number, string> = {
    0: "Pendeltåg",
    2: "Tunnelbana",
    4: "Spårvagn",
    5: "Buss",
    9: "Båt",
    14: "Tåg",
  };
  return productClass !== undefined ? map[productClass] || "Okänt" : "";
}

function JourneyCard({ journey }: { journey: Journey }) {
  const [expanded, setExpanded] = useState(false);
  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs[journey.legs.length - 1];
  const depTime = firstLeg?.origin?.departureTimeEstimated || firstLeg?.origin?.departureTimePlanned;
  const arrTime = lastLeg?.destination?.arrivalTimeEstimated || lastLeg?.destination?.arrivalTimePlanned;
  const duration = journey.tripRtDuration || journey.tripDuration;

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>{formatTime(depTime)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{formatTime(arrTime)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </span>
            <span className="flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {journey.interchanges} byte{journey.interchanges !== 1 ? "n" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {journey.legs
              .filter((leg) => leg.transportation?.product)
              .map((leg, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground font-medium"
                >
                  {leg.transportation?.product?.name || getProductName(leg.transportation?.product?.class)}{" "}
                  {leg.transportation?.disassembledName || leg.transportation?.number || ""}
                </span>
              ))}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          {journey.legs.map((leg, i) => {
            const isTransit = !!leg.transportation?.product;
            const isWalk = !isTransit;
            const depT = leg.origin.departureTimeEstimated || leg.origin.departureTimePlanned;
            const arrT = leg.destination.arrivalTimeEstimated || leg.destination.arrivalTimePlanned;

            // Use parent name for platforms, fallback to name
            const originName = leg.origin.type === "platform" && leg.origin.parent?.name
              ? leg.origin.parent.name.split(",")[0]
              : leg.origin.disassembledName || leg.origin.name;
            const destName = leg.destination.type === "platform" && leg.destination.parent?.name
              ? leg.destination.parent.name.split(",")[0]
              : leg.destination.disassembledName || leg.destination.name;

            // Platform/track info
            const originPlatform = leg.origin.type === "platform" ? leg.origin.disassembledName : undefined;
            const destPlatform = leg.destination.type === "platform" ? leg.destination.disassembledName : undefined;

            if (isWalk) {
              return (
                <div key={i} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center w-6">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-1.5" />
                    <div className="w-0.5 flex-1 border-l-2 border-dashed border-muted-foreground/30" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mb-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-12 shrink-0">{formatTime(depT)}</span>
                      <span className="text-muted-foreground">{originName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-14 py-1 italic">
                      🚶 Gå {formatDuration(leg.duration)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-12 shrink-0">{formatTime(arrT)}</span>
                      <span className="text-muted-foreground">{destName}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="flex gap-3 py-2">
                <div className="flex flex-col items-center w-6">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                  <div className="w-0.5 flex-1 bg-primary/30" />
                  <div className="w-3 h-3 rounded-full border-2 border-primary bg-card mb-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground w-12 shrink-0">{formatTime(depT)}</span>
                    <span className="font-semibold">{originName}</span>
                    {originPlatform && (
                      <span className="text-xs text-muted-foreground">Läge {originPlatform}</span>
                    )}
                  </div>
                  <div className="ml-14 my-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-primary text-primary-foreground rounded">
                      {leg.transportation?.product?.name || getProductName(leg.transportation?.product?.class)}{" "}
                      {leg.transportation?.disassembledName || leg.transportation?.number || ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      → {leg.transportation?.destination?.name || destName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground w-12 shrink-0">{formatTime(arrT)}</span>
                    <span className="font-semibold">{destName}</span>
                    {destPlatform && (
                      <span className="text-xs text-muted-foreground">Läge {destPlatform}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TripPlannerPage() {
  const [origin, setOrigin] = useState<JourneyLocation | null>(null);
  const [destination, setDestination] = useState<JourneyLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [routeType, setRouteType] = useState<TripSearchParams["routeType"]>("leasttime");
  const [searchKey, setSearchKey] = useState(0);

  const searchParams: TripSearchParams | null =
    origin && destination
      ? {
          originId: origin.id,
          destinationId: destination.id,
          numTrips: 3,
          routeType,
          ...filters,
        }
      : null;

  const { data, isLoading } = useQuery({
    queryKey: ["trips", searchParams, searchKey],
    queryFn: () => searchTrips(searchParams!),
    enabled: !!searchParams && searchKey > 0,
  });

  const swap = () => {
    const o = origin;
    setOrigin(destination);
    setDestination(o);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Reseplanerare</h2>
        <p className="text-muted-foreground text-sm">Planera din resa från A till B</p>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Från</label>
          <JourneyStopSearch
            onSelect={setOrigin}
            placeholder="Varifrån reser du?"
            value={origin?.disassembledName || origin?.name || ""}
          />
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={swap} className="text-muted-foreground">
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Till</label>
          <JourneyStopSearch
            onSelect={setDestination}
            placeholder="Vart ska du?"
            value={destination?.disassembledName || destination?.name || ""}
          />
        </div>
      </div>

      <div className="mb-4">
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Settings2 className="h-4 w-4" />
          Filter
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showFilters && (
          <div className="mt-3 p-4 bg-card rounded-lg shadow-card space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Trafikslag</p>
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.key}
                    variant={filters[opt.key] === false ? "outline" : "default"}
                    size="sm"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        [opt.key]: f[opt.key] === false ? true : false,
                      }))
                    }
                    className="text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Sortering</p>
              <div className="flex flex-wrap gap-2">
                {ROUTE_TYPES.map((rt) => (
                  <Button
                    key={rt.value}
                    variant={routeType === rt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRouteType(rt.value)}
                    className="text-xs"
                  >
                    {rt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!origin || !destination}
        onClick={() => setSearchKey((k) => k + 1)}
      >
        Sök resa
      </Button>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 shadow-card animate-pulse h-20" />
          ))}
        </div>
      )}

      {data?.journeys && data.journeys.length > 0 && (
        <div className="mt-6 space-y-3">
          {data.journeys.map((journey) => (
            <JourneyCard key={journey.tripId} journey={journey} />
          ))}
        </div>
      )}

      {data?.journeys && data.journeys.length === 0 && (
        <div className="mt-6 text-center py-12 text-muted-foreground">
          <p>Inga resor hittades</p>
        </div>
      )}
    </div>
  );
}
