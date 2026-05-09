import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Location, LocationJson, UserCoordinates } from '../models/location.model';
import {apiUrl} from '../api.config';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = apiUrl('/api/locations');

  private readonly _locations = signal<Location[]>([]);
  private readonly _selected = signal<Location[]>([]);
  private readonly _userCoords = signal<UserCoordinates | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly locations = this._locations.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly userCoords = this._userCoords.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAllSelected = computed(() => this._selected().length === 0);
  readonly selectedIds = computed(() => this._selected().map((l) => l.id));
  readonly selectedAddressIds = computed(() =>
    this._selected().length === 0
      ? this._locations().flatMap((l) => l.addressIds)
      : this._selected().flatMap((l) => l.addressIds)
  );
  readonly displayLabel = computed(() => {
    const sel = this._selected();
    if (sel.length === 0) return 'All Locations';
    if (sel.length === 1) return sel[0].name;
    return `${sel.length} Locations`;
  });

  loadLocations(): Observable<Location[]> {
    this._loading.set(true);
    this._error.set(null);

    // The apiEnvelopeInterceptor already unwraps { status, data, errors } →
    // we receive LocationJson[] directly.
    return this.http.get<LocationJson[]>(`${this.apiUrl}`).pipe(
      map((items) => items.map((l) => this.mapLocation(l))),
      tap((locations) => {
        this._locations.set(locations);
        this._loading.set(false);
        this.applyGeolocation(locations);
      }),
      catchError(() => {
        this._loading.set(false);
        this._error.set('Failed to load locations');
        return of([]);
      })
    );
  }

  setSelected(locations: Location[]): void {
    this._selected.set(locations);
  }

  clearSelected(): void {
    this._selected.set([]);
  }

  selectAll(): void {
    this._selected.set([]);
  }

  private applyGeolocation(locations: Location[]): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: UserCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this._userCoords.set(coords);
        const nearest = this.findNearestLocation(coords, locations);
        if (nearest) {
          nearest.isNearby = true;
          this._selected.set([nearest]);
        }
      },
      () => {
        this._selected.set([]);
      },
      { timeout: 5000 }
    );
  }

  private findNearestLocation(coords: UserCoordinates, locations: Location[]): Location | null {
    const CITY_COORDS: Record<string, UserCoordinates> = {
      Chennai:   { lat: 13.0827, lng: 80.2707 },
      Bangalore: { lat: 12.9716, lng: 77.5946 },
      Mumbai:    { lat: 19.076,  lng: 72.8777 },
      Delhi:     { lat: 28.6139, lng: 77.209  },
      Hyderabad: { lat: 17.385,  lng: 78.4867 },
      Pune:      { lat: 18.5204, lng: 73.8567 }
    };

    let nearest: Location | null = null;
    let minDist = Infinity;

    for (const loc of locations) {
      const cityCoord = CITY_COORDS[loc.name];
      if (!cityCoord) continue;
      const dist = this.haversine(coords, cityCoord);
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    }

    const MAX_RADIUS_KM = 100;
    return minDist <= MAX_RADIUS_KM ? nearest : null;
  }

  private haversine(a: UserCoordinates, b: UserCoordinates): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  private mapLocation(raw: LocationJson): Location {
    return {
      id: raw.locationId,
      name: raw.name,
      description: raw.description,
      addressIds: raw.addressIds,
      isNearby: false
    };
  }
}
