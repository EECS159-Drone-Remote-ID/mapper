import ExpandedBounds from "@/models/ExpandedBounds";

export function expandMapBounds(
  mapBounds: google.maps.LatLngBounds | null
): ExpandedBounds | null {
  return mapBounds != null
    ? {
        latN: mapBounds.getNorthEast().lat(),
        latS: mapBounds.getSouthWest().lat(),
        lngE: mapBounds.getNorthEast().lng(),
        lngW: mapBounds.getSouthWest().lng(),
      }
    : null;
}
