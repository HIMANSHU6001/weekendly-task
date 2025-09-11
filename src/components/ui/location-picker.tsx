'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (location: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
}

export function LocationPicker({
                                 value,
                                 onChange,
                                 placeholder = "Search for a location...",
                                 className = ""
                               }: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Get user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.warn("Location access denied, fallback to global search")
      );
    }
  }, []);

  // Fetch suggestions from LocationIQ
  const fetchSuggestions = async (query: string) => {
    const key = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
    if (!key) {
      console.error("LocationIQ API key missing");
      return [];
    }

    const proximity = coords ? `&viewbox=${coords.lon-0.05},${coords.lat+0.05},${coords.lon+0.05},${coords.lat-0.05}&bounded=1` : "";
    const url = `https://us1.locationiq.com/v1/search?key=${key}&q=${encodeURIComponent(
      query
    )}&limit=5&format=json${proximity}`;

    setIsLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("LocationIQ search error:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.length > 2) {
      const results = await fetchSuggestions(newValue);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={isLoading ? "Loading..." : placeholder}
          className={`pl-10 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
          {suggestions.map((place, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(place.display_name, place);
                setSuggestions([]);
              }}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
