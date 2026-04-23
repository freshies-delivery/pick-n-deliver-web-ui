import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface OutletDto {
  outletId?: number;
  clientId?: number;
  addressId?: number;
  name: string;
  description?: string;
  type?: string;
  outletUri?: string;
  latitude?: number;
  longitude?: number;
  isVeg?: boolean;
  isPickupAvailable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OutletService {
  private readonly endpoint = apiUrl('/api/outlets');

  constructor(private readonly http: HttpClient) {}

  list(clientId?: number): Observable<OutletDto[]> {
    const params = clientId ? new HttpParams().set('clientId', String(clientId)) : undefined;

    return this.http.get<OutletDto[]>(this.endpoint, { params }).pipe(
      map((outlets) => (clientId ? outlets.filter((outlet) => outlet.clientId === clientId) : outlets))
    );
  }

  create(payload: OutletDto): Observable<OutletDto> {
    return this.http.post<OutletDto>(this.endpoint, payload);
  }

  update(id: number, payload: OutletDto): Observable<OutletDto> {
    return this.http.put<OutletDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

