import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface CategoryDto {
  categoryId?: number;
  name: string;
  description?: string;
  outletId?: number;
  outletIds?: number[];
  itemIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly endpoint = apiUrl('/api/categories');

  constructor(private readonly http: HttpClient) {}

  list(outletId?: number): Observable<CategoryDto[]> {
    const params = outletId ? new HttpParams().set('outletId', String(outletId)) : undefined;

    return this.http.get<CategoryDto[]>(this.endpoint, { params });
  }

  create(payload: CategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.endpoint, payload);
  }

  update(id: number, payload: CategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

