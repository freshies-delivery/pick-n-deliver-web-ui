import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  totalSessions:    number;
  ordersThisMonth:  number;
  reviewsGiven:     number;
  supportTickets:   number;
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
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

  getActivity(userId: number, _range: '7d' | '30d' | '90d' | 'all' = '30d'): Observable<UserActivityEvent[]> {
    const now = new Date();
    const d = (hours: number) => new Date(now.getTime() - hours * 3600000);

    return of([
      { id: 'ev1',  type: 'order_placed'    as const, title: 'Placed order #SW-20147 at Saravana Bhavan', detail: '2× Biryani · 1× Naan',        timestamp: d(1)   },
      { id: 'ev2',  type: 'order_delivered' as const, title: 'Order #SW-20140 delivered in 28 min',      detail: 'Rated ★★★★★ after delivery',   timestamp: d(3)   },
      { id: 'ev3',  type: 'review_given'    as const, title: 'Rated Murugan Idli Shop 5★',               detail: '"Food was excellent!"',          timestamp: d(5)   },
      { id: 'ev4',  type: 'login'           as const, title: 'Logged in from Chennai',                   detail: 'iPhone · iOS 17',                timestamp: d(8)   },
      { id: 'ev5',  type: 'order_placed'    as const, title: 'Placed order #SW-20130 at KFC',            detail: '1× Bucket Meal',                 timestamp: d(26)  },
      { id: 'ev6',  type: 'order_cancelled' as const, title: 'Cancelled order #SW-20125',                detail: 'Reason: took too long',          timestamp: d(48)  },
      { id: 'ev7',  type: 'address_added'   as const, title: 'Added new Home address',                   detail: 'Anna Nagar, Chennai',            timestamp: d(72)  },
      { id: 'ev8',  type: 'support_ticket'  as const, title: 'Opened support ticket #T-4821',            detail: 'Missing item in order',          timestamp: d(96)  },
      { id: 'ev9',  type: 'refund'          as const, title: 'Refund ₹180 processed for #SW-20115',      detail: 'Credited to original payment',   timestamp: d(120) },
      { id: 'ev10', type: 'order_delivered' as const, title: 'Order #SW-20110 delivered in 22 min',      detail: 'Pizza Hut — T.Nagar',            timestamp: d(144) },
    ]).pipe(delay(400));
  }

  getStats(userId: number): Observable<UserActivityStats> {
    return of({
      totalSessions:   48,
      ordersThisMonth: 12,
      reviewsGiven:    7,
      supportTickets:  2,
    }).pipe(delay(300));
  }

  getColor(type: ActivityType): string {
    return ACTIVITY_COLORS[type] ?? '#6B7280';
  }
}
