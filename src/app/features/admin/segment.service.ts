import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { apiUrl } from '../../core/api.config';

export interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  criteriaReadable: string;
  userCount: number;
  isActive: boolean;
  createdAt: Date;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class SegmentService {
  private readonly endpoint = apiUrl('/api/segments');

  constructor(private readonly http: HttpClient) {}

  create(body: Record<string, unknown>): Observable<Segment> {
    return this.http.post<Record<string, unknown>>(this.endpoint, body).pipe(map(r => this.map(r)));
  }

  update(id: string, body: Record<string, unknown>): Observable<Segment> {
    return this.http.put<Record<string, unknown>>(`${this.endpoint}/${id}`, body).pipe(map(r => this.map(r)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  list(): Observable<Segment[]> {
    // TODO: Replace with real endpoint once API contract is defined.
    // Mock: public/mock/segments.json
    return this.http.get<Record<string, unknown>[]>('mock/segments.json').pipe(
      delay(400),
      map((data) => data.map((raw) => this.map(raw)))
    );
  }

  private map(raw: Record<string, unknown>): Segment {
    return {
      id: raw['id'] as string,
      name: raw['name'] as string,
      description: raw['description'] as string,
      criteria: raw['criteria'] as string,
      criteriaReadable: raw['criteria_readable'] as string,
      userCount: raw['user_count'] as number,
      isActive: raw['is_active'] as boolean,
      createdAt: new Date(raw['created_at'] as string),
      color: raw['color'] as string
    };
  }
}
