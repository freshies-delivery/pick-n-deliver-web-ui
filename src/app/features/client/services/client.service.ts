import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface ClientDto {
  clientId?: number;
  outletIds?: number[];
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly endpoint = apiUrl('/api/clients');

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>(this.endpoint);
  }

  create(payload: ClientDto): Observable<ClientDto> {
    return this.http.post<ClientDto>(this.endpoint, payload);
  }

  update(id: number, payload: ClientDto): Observable<ClientDto> {
    return this.http.put<ClientDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

