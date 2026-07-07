type GeocodeResponse = {
  status: string;
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  error_message?: string;
};

async function geocode(
  address: string,
  apiKey: string | undefined,
): Promise<GeocodeResponse | null> {
  const key = apiKey?.trim();
  if (!key) return null;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${key}`,
  );
  if (!response.ok) return null;
  return (await response.json()) as GeocodeResponse;
}

type Coordinates = { lat: number; lng: number };

/** Same geocoding flow as gql.book-store.com.pl/backend/utils/location.ts */
export async function getCoordsForAddress(
  address: string,
  apiKey?: string,
): Promise<Coordinates> {
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new Error('Could not get location for the specified address');
  }

  let data: GeocodeResponse | null = await geocode(address.trim(), apiKey);

  if (!data || data.status !== 'OK') {
    const fallback = address.trim().includes(',')
      ? null
      : `${address.trim()}, Warsaw, Poland`;
    if (fallback) {
      data = await geocode(fallback, apiKey);
    }
  }

  if (!data || data.status !== 'OK') {
    const detail = data?.error_message ?? data?.status ?? 'missing API key';
    throw new Error(
      `Could not get location for the specified address (${detail})`,
    );
  }

  const firstResult = data.results?.[0];
  if (!firstResult?.geometry?.location) {
    throw new Error('Could not get location for the specified address');
  }

  return firstResult.geometry.location;
}
