import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStops, type JourneyLocation } from "@/lib/sl-api";

interface JourneyStopSearchProps {
  onSelect: (location: JourneyLocation) => void;
  placeholder?: string;
  value?: string;
}

export default function JourneyStopSearch({ onSelect, placeholder = "Sök hållplats...", value }: JourneyStopSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<JourneyLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const locs = await searchStops(query);
        setResults(locs.slice(0, 6));
        setIsOpen(locs.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-card"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border rounded-lg shadow-elevated overflow-hidden">
          {results.map((loc) => (
            <button
              key={loc.id}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors text-sm"
              onClick={() => {
                onSelect(loc);
                setQuery(loc.disassembledName || loc.name);
                setIsOpen(false);
              }}
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-medium">{loc.disassembledName || loc.name}</span>
                {loc.parent?.name && (
                  <span className="text-muted-foreground ml-1 text-xs">{loc.parent.name}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
