import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface RatingDto {
  ratingId?: number;
  userId?: number;
  targetType?: string;
  targetId?: number;
  score?: number;
  comment?: string;
  metadata?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UserRatingService {
  private readonly endpoint = apiUrl('/api/ratings');

  constructor(private readonly http: HttpClient) {}

  listForUser(userId: number): Observable<RatingDto[]> {
    const params = new HttpParams()
      .set('targetType', 'USER')
      .set('targetId', String(userId));
    return this.http.get<RatingDto[]>(this.endpoint, { params });
  }

  create(payload: RatingDto): Observable<RatingDto> {
    return this.http.post<RatingDto>(this.endpoint, payload);
  }

  update(id: number, payload: RatingDto): Observable<RatingDto> {
    return this.http.put<RatingDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

