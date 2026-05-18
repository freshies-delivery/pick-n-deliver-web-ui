import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface AddressDto {
  addressId?: number;
  userId?: number;
  outletId?: number;
  outletName?: string;
  doorNo?: string;
  buildingName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  instructions?: string;
  label?: string;
  receiverName?: string;
  receiverPhone?: string;
  favorite?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly endpoint = apiUrl('/api/addresses');

  constructor(private readonly http: HttpClient) {}

  list(): Observable<AddressDto[]> {
    return this.http.get<AddressDto[]>(this.endpoint);
  }

  listForUser(userId: number): Observable<AddressDto[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<AddressDto[]>(this.endpoint, { params });
  }

  get(id: number): Observable<AddressDto> {
    return this.http.get<AddressDto>(`${this.endpoint}/${id}`);
  }

  create(payload: AddressDto): Observable<AddressDto> {
    return this.http.post<AddressDto>(this.endpoint, payload);
  }

  update(id: number, payload: AddressDto): Observable<AddressDto> {
    return this.http.put<AddressDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

