import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSites, fetchDepartures, type Site } from "@/lib/sl-api";
import StationSearch from "@/components/StationSearch";
import DepartureBoard from "@/components/DepartureBoard";
import FavoriteStationCard from "@/components/FavoriteStationCard";
import { useFavoriteStations } from "@/hooks/use-favorite-stations";
import { RefreshCw, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeparturesPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteStations();

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

  const handleSelectFavorite = (site: Site) => {
    setSelectedSite(site);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Avgångar i realtid</h2>
        <p className="text-muted-foreground text-sm">Sök en station för att se kommande avgångar</p>
      </div>

      <div className="mb-6">
        <StationSearch sites={sites} onSelect={setSelectedSite} placeholder="Sök station, t.ex. Slussen..." />
      </div>

      {/* Favorite stations */}
      {favorites.length > 0 && !selectedSite && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            Favoritstationer
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.map((site) => (
              <FavoriteStationCard
                key={site.id}
                site={site}
                onSelect={handleSelectFavorite}
                onRemove={removeFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {selectedSite && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedSite.name}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isFavorite(selectedSite.id)) {
                    removeFavorite(selectedSite.id);
                  } else {
                    addFavorite(selectedSite);
                  }
                }}
                className="text-muted-foreground"
                title={isFavorite(selectedSite.id) ? "Ta bort favorit" : "Lägg till favorit"}
              >
                {isFavorite(selectedSite.id) ? (
                  <Star className="h-4 w-4 fill-accent text-accent" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
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
          </div>

          {departuresData?.stop_deviations && departuresData.stop_deviations.length > 0 && (
            <div className="mb-4 p-3 bg-secondary rounded-lg border border-severity-medium/20">
              {departuresData.stop_deviations.map((d, i) => (
                <p key={i} className="text-sm text-secondary-foreground">⚠ {d.message}</p>
              ))}
            </div>
          )}

          <DepartureBoard departures={departuresData?.departures || []} loading={isLoading} />

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSite(null)} className="text-muted-foreground">
              ← Tillbaka till favoriter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
