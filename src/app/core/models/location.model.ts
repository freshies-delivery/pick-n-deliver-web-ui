export interface LocationResponse {
  status: string;
  data: LocationJson[];
  errors: string | null;
}

export interface LocationJson {
  locationId: number;
  name: string;
  description: string;
  addressIds: number[];
}

export interface Location {
  id: number;
  name: string;
  description: string;
  addressIds: number[];
  isNearby?: boolean;
}

export interface UserCoordinates {
  lat: number;
  lng: number;
}
