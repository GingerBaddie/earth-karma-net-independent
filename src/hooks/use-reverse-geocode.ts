import { useState, useEffect } from "react";

export function useReverseGeocode(lat: number | null, lng: number | null) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setAddress(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.display_name) {
          setAddress(data.display_name);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { address, loading };
}
