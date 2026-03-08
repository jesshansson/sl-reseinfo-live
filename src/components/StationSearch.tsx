import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Site } from "@/lib/sl-api";

interface StationSearchProps {
  sites: Site[];
  onSelect: (site: Site) => void;
  selectedSite?: Site | null;
  onClear?: () => void;
  placeholder?: string;
}

export default function StationSearch({
  sites,
  onSelect,
  selectedSite,
  onClear,
  placeholder = "Sök station...",
}: StationSearchProps) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Site[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setFiltered([]);
      setIsOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const results = sites
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
    setFiltered(results);
    setIsOpen(results.length > 0);
  }, [query, sites]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // If a station is selected, show it as a "chip" instead of the input
  if (selectedSite) {
    return (
      <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2.5">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium text-sm flex-1">{selectedSite.name}</span>
        <button
          onClick={() => {
            setQuery("");
            onClear?.();
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="p-1 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Byt station"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-card"
          onFocus={() => filtered.length > 0 && setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border rounded-lg shadow-elevated overflow-hidden">
          {filtered.map((site) => (
            <button
              key={site.id}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors text-sm"
              onClick={() => {
                onSelect(site);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{site.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
