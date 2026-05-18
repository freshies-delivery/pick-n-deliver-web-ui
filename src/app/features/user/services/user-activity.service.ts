import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export type ActivityType =
  | 'order_placed'
  | 'order_delivered'
  | 'order_cancelled'
  | 'review_given'
  | 'login'
  | 'address_added'
  | 'support_ticket'
  | 'refund';

export interface UserActivityEvent {
  id:        string;
  type:      ActivityType;
  title:     string;
  detail?:   string;
  timestamp: Date;
}

export interface UserActivityStats {
  totalEvents:     number;
  ordersThisMonth: number;
  reviewsGiven:    number;
  totalAddresses:  number;
}

const ACTIVITY_COLORS: Record<string, string> = {
  order_placed:     '#3B82F6',
  order_delivered:  '#22C55E',
  order_cancelled:  '#F43F5E',
  review_given:     '#F59E0B',
  login:            '#6366F1',
  address_added:    '#14B8A6',
  support_ticket:   '#EC4899',
  refund:           '#F97316',
};

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  constructor(private readonly http: HttpClient) {}

  getActivity(userId: number, range: '7d' | '30d' | '90d' | 'all' = '30d'): Observable<UserActivityEvent[]> {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 0;
    const params = new HttpParams().set('days', String(days));
    return this.http.get<any[]>(apiUrl(`/api/users/${userId}/activity`), { params }).pipe(
      map(list => list.map(e => ({
        id:        e.id,
        type:      e.type as ActivityType,
        title:     e.title,
        detail:    e.detail,
        timestamp: new Date(e.timestamp),
      })))
    );
  }

  getStats(userId: number): Observable<UserActivityStats> {
    return this.http.get<UserActivityStats>(apiUrl(`/api/users/${userId}/activity/stats`));
  }

  getColor(type: string): string {
    return ACTIVITY_COLORS[type] ?? '#6B7280';
  }
}
