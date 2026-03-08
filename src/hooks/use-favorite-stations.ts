import { useState, useCallback, useEffect } from "react";
import type { Site } from "@/lib/sl-api";

const STORAGE_KEY = "sl-favorite-stations";

export function useFavoriteStations() {
  const [favorites, setFavorites] = useState<Site[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((site: Site) => {
    setFavorites((prev) => {
      if (prev.some((s) => s.id === site.id)) return prev;
      return [...prev, site];
    });
  }, []);

  const removeFavorite = useCallback((siteId: number) => {
    setFavorites((prev) => prev.filter((s) => s.id !== siteId));
  }, []);

  const isFavorite = useCallback(
    (siteId: number) => favorites.some((s) => s.id === siteId),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
