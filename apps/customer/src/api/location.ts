export type LocationSuggestion = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function buildAddress(
  properties: PhotonFeature['properties'],
): string {
  if (!properties) {
    return '';
  }

  const parts = [
    properties.housenumber,
    properties.street,
    properties.locality,
    properties.district,
    properties.city,
    properties.county,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter(
    (value): value is string =>
      typeof value === 'string' &&
      value.trim().length > 0,
  );

  return [...new Set(parts)].join(', ');
}

export async function searchLocations(
  query: string,
): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const url =
    `https://photon.komoot.io/api/` +
    `?q=${encodeURIComponent(trimmedQuery)}` +
    `&limit=8`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Location search failed with status ${response.status}`,
    );
  }

  const data =
    (await response.json()) as PhotonResponse;

  return (data.features ?? [])
    .map((feature, index) => {
      const coordinates =
        feature.geometry?.coordinates;

      const properties = feature.properties;

      if (
        !coordinates ||
        coordinates.length !== 2 ||
        !properties
      ) {
        return null;
      }

      const [
        longitude,
        latitude,
      ] = coordinates;

      const name =
        properties.name?.trim() ||
        properties.city?.trim() ||
        properties.locality?.trim() ||
        'Selected location';

      return {
        id:
          `${properties.osm_type ?? 'place'}-` +
          `${properties.osm_id ?? index}`,
        name,
        address: buildAddress(properties),
        latitude,
        longitude,
      };
    })
    .filter(
      (
        location,
      ): location is LocationSuggestion =>
        location !== null,
    );
}