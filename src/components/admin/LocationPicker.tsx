import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Search } from "lucide-react";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";

interface LocationPickerProps {
  location: string;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (location: string) => void;
  onCoordsChange: (lat: number | null, lng: number | null) => void;
}

export default function LocationPicker({ location, latitude, longitude, onLocationChange, onCoordsChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const { address } = useReverseGeocode(latitude, longitude);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
    setSearching(false);
  };

  const selectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    onLocationChange(s.display_name);
    onCoordsChange(parseFloat(s.lat), parseFloat(s.lon));
    setSuggestions([]);
    setSearchQuery("");
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordsChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {}
    );
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Event Location</Label>
      <Input value={location} onChange={(e) => onLocationChange(e.target.value)} placeholder="Location name (auto-filled when searching)" />
      
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a place..."
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
        />
        <Button type="button" size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleUseCurrentLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSuggestion(s)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors"
            >
              <p className="font-medium truncate">{s.display_name}</p>
              <p className="text-xs text-muted-foreground">{parseFloat(s.lat).toFixed(4)}, {parseFloat(s.lon).toFixed(4)}</p>
            </button>
          ))}
        </div>
      )}

      {latitude && longitude && (
        <div className="rounded-lg border bg-secondary/20 p-3 text-sm">
          <p className="text-muted-foreground">📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
          {address && <p className="text-xs text-foreground/70 mt-1">🏠 {address}</p>}
        </div>
      )}
    </div>
  );
}
