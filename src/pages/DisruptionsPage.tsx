import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDeviations, getTransportModeLabel } from "@/lib/sl-api";
import { AlertTriangle, Info, ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TRANSPORT_MODES = [
  { value: "METRO", label: "Tunnelbana" },
  { value: "BUS", label: "Buss" },
  { value: "TRAIN", label: "Tåg" },
  { value: "TRAM", label: "Spårvagn" },
  { value: "SHIP", label: "Båt" },
];

function SeverityIcon({ level }: { level: number }) {
  if (level >= 7) return <AlertTriangle className="h-5 w-5 text-severity-high shrink-0" />;
  if (level >= 4) return <AlertTriangle className="h-5 w-5 text-severity-medium shrink-0" />;
  return <Info className="h-5 w-5 text-severity-info shrink-0" />;
}

export default function DisruptionsPage() {
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [lineSearch, setLineSearch] = useState("");

  const { data: deviations = [], isLoading } = useQuery({
    queryKey: ["deviations", selectedModes],
    queryFn: () => fetchDeviations({
      transportMode: selectedModes.length > 0 ? selectedModes : undefined,
    }),
    refetchInterval: 60000,
  });

  const filteredDeviations = useMemo(() => {
    if (!lineSearch.trim()) return deviations;
    const q = lineSearch.trim().toLowerCase();
    return deviations.filter((dev) => {
      const linesMatch = dev.scope?.lines?.some(
        (line) => line.designation?.toLowerCase().includes(q) || line.name?.toLowerCase().includes(q)
      );
      const headerMatch = dev.message_variants?.some(
        (v) => v.header?.toLowerCase().includes(q) || v.scope_alias?.toLowerCase().includes(q)
      );
      return linesMatch || headerMatch;
    });
  }, [deviations, lineSearch]);

  const toggleMode = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Störningar i trafiken</h2>
        <p className="text-muted-foreground text-sm">Aktuella och kommande störningar i SL-trafiken</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtrera trafikslag</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRANSPORT_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={selectedModes.includes(mode.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleMode(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={lineSearch}
            onChange={(e) => setLineSearch(e.target.value)}
            placeholder="Sök linje, t.ex. 17 eller 873..."
            className="pl-10 bg-card"
          />
        </div>
        </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 shadow-card animate-pulse h-20" />
          ))}
        </div>
      ) : filteredDeviations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{lineSearch ? "Inga störningar matchar din sökning" : "Inga störningar just nu"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeviations.map((dev) => {
            const sv = dev.message_variants?.find((v) => v.language === "sv") || dev.message_variants?.[0];
            const isExpanded = expandedIds.has(dev.deviation_case_id);
            const level = dev.priority?.importance_level ?? 0;

            return (
              <div
                key={dev.deviation_case_id}
                className="bg-card rounded-lg shadow-card overflow-hidden"
              >
                <button
                  className="w-full px-4 py-3 flex items-start gap-3 text-left"
                  onClick={() => toggleExpanded(dev.deviation_case_id)}
                >
                  <SeverityIcon level={level} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{sv?.header || "Störning"}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sv?.scope_alias && (
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                          {sv.scope_alias}
                        </span>
                      )}
                      {dev.scope?.lines?.slice(0, 3).map((line) => (
                        <span key={line.id} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                          {getTransportModeLabel(line.transport_mode)} {line.designation}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </button>
                {isExpanded && sv?.details && (
                  <div className="px-4 pb-4 pl-12">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{sv.details}</p>
                    {sv.weblink && (
                      <a
                        href={sv.weblink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Läs mer →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
