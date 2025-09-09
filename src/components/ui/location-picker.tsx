'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (location: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = ""
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      // You'll need to add your Google Maps API key here
      const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not found. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.');
        return;
      }

      try {
        setIsLoading(true);

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        setIsGoogleMapsLoaded(true);

        if (inputRef.current) {
          // Initialize the autocomplete
          autocompleteRef.current = new google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ['establishment', 'geocode'],
              fields: ['name', 'formatted_address', 'place_id', 'geometry', 'types']
            }
          );

          // Add place changed listener
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();

            if (place && place.formatted_address) {
              onChange(place.formatted_address, place);
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoogleMaps();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={isLoading ? "Loading Google Maps..." : placeholder}
          disabled={isLoading || !isGoogleMapsLoaded}
          className={`pl-10 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>

      {!isGoogleMapsLoaded && !isLoading && (
        <p className="text-xs text-muted-foreground mt-1">
          Google Maps not available. You can still enter locations manually.
        </p>
      )}
    </div>
  );
}
