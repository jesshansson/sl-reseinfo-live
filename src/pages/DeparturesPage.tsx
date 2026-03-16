import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSites, fetchDepartures, type Site } from "@/lib/sl-api";
import StationSearch from "@/components/StationSearch";
import DepartureBoard from "@/components/DepartureBoard";
import FavoriteStationCard from "@/components/FavoriteStationCard";
import { useFavoriteStations } from "@/hooks/use-favorite-stations";
import { RefreshCw, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

function useNearbyStations(sites: Site[], enabled: boolean) {
  const [nearby, setNearby] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !navigator.geolocation || sites.length === 0) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const withDistance = sites
          .filter((s) => s.lat && s.lon)
          .map((s) => {
            const dLat = s.lat! - latitude;
            const dLon = s.lon! - longitude;
            return { site: s, dist: Math.sqrt(dLat * dLat + dLon * dLon) };
          })
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3)
          .map((x) => x.site);

        setNearby(withDistance);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [sites, enabled]);

  return { nearby, loading };
}

export default function DeparturesPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [hideNearby, setHideNearby] = useState(false);
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

  const showNearby = !selectedSite && favorites.length === 0 && !hideNearby;
  const { nearby, loading: nearbyLoading } = useNearbyStations(sites, showNearby);

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Avgångar i realtid</h2>
        <p className="text-muted-foreground text-sm">Sök en station för att se kommande avgångar</p>
      </div>

      {/* Search — always visible */}
      <div className="mb-6">
        <StationSearch
          sites={sites}
          onSelect={setSelectedSite}
          selectedSite={selectedSite}
          onClear={() => setSelectedSite(null)}
          placeholder="Sök station, t.ex. Slussen..."
        />
      </div>

      {/* Station selected: show actions + departures */}
      {selectedSite && (
        <div>
          <div className="flex items-center justify-between mb-4">
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
              className={isFavorite(selectedSite.id) ? "" : "text-muted-foreground"}
            >
              <Star className={`h-4 w-4 mr-1.5 ${isFavorite(selectedSite.id) ? "fill-accent text-accent" : ""}`} />
              {isFavorite(selectedSite.id) ? "Sparad som favorit" : "Spara som favorit"}
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

      {/* No station selected: show favorites */}
      {!selectedSite && favorites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            Dina favoriter
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.map((site) => (
              <FavoriteStationCard
                key={site.id}
                site={site}
                onSelect={setSelectedSite}
                onRemove={removeFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* No station selected, no favorites: show nearby or empty state */}
      {!selectedSite && favorites.length === 0 && (
        <div>
          {nearbyLoading && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Letar efter stationer i närheten...
            </div>
          )}

          {!nearbyLoading && nearby.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Stationer i närheten
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {nearby.map((site) => (
                  <FavoriteStationCard
                    key={site.id}
                    site={site}
                    onSelect={setSelectedSite}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {!nearbyLoading && nearby.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sök efter en station ovan för att se avgångar</p>
              <p className="text-xs mt-1">Du kan spara stationer som favoriter för snabb åtkomst</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}