import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSites, fetchDepartures, type Site } from "@/lib/sl-api";
import StationSearch from "@/components/StationSearch";
import DepartureBoard from "@/components/DepartureBoard";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeparturesPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
    staleTime: 1000 * 60 * 30,
  });

  const {
    data: departuresData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["departures", selectedSite?.id],
    queryFn: () => fetchDepartures(selectedSite!.id),
    enabled: !!selectedSite,
    refetchInterval: 30000,
  });

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Avgångar i realtid</h2>
        <p className="text-muted-foreground text-sm">Sök en station för att se kommande avgångar</p>
      </div>

      <div className="mb-6">
        <StationSearch sites={sites} onSelect={setSelectedSite} placeholder="Sök station, t.ex. Slussen..." />
      </div>

      {selectedSite && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedSite.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Uppdatera
            </Button>
          </div>

          {departuresData?.stop_deviations && departuresData.stop_deviations.length > 0 && (
            <div className="mb-4 p-3 bg-secondary rounded-lg border border-severity-medium/20">
              {departuresData.stop_deviations.map((d, i) => (
                <p key={i} className="text-sm text-secondary-foreground">⚠ {d.message}</p>
              ))}
            </div>
          )}

          <DepartureBoard departures={departuresData?.departures || []} loading={isLoading} />
        </div>
      )}
    </div>
  );
}
