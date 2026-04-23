import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface ItemDto {
  itemId?: number;
  outletId?: number;
  categoryId?: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  available?: boolean;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly endpoint = apiUrl('/api/items');

  constructor(private readonly http: HttpClient) {}

  list(outletId?: number, categoryId?: number): Observable<ItemDto[]> {
    let params = new HttpParams();
    if (outletId) {
      params = params.set('outletId', String(outletId));
    }
    if (categoryId) {
      params = params.set('categoryId', String(categoryId));
    }

    return this.http.get<ItemDto[]>(this.endpoint, { params });
  }

  create(payload: ItemDto): Observable<ItemDto> {
    return this.http.post<ItemDto>(this.endpoint, payload);
  }

  update(id: number, payload: ItemDto): Observable<ItemDto> {
    return this.http.put<ItemDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

