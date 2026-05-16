import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface OutletDashboardStats {
  ordersToday: number;
  ordersTodayChange: number;
  revenueToday: number;
  revenueTodayChange: number;
  avgDeliveryMinutes: number;
  avgDeliveryChange: number;
  avgRating: number;
  avgRatingChange: number;
  sparklines: {
    orders:   number[];
    revenue:  number[];
    delivery: number[];
    rating:   number[];
  };
  weeklyOrders: { day: string; count: number }[];
  revenueBreakdown: {
    foodOrders:   number;
    deliveryFees: number;
    tips:         number;
  };
  deliveryMetrics: {
    onTimePercent:   number;
    avgMinutes:      number;
    fastestMinutes:  number;
    cancelledToday:  number;
    activeRiders:    number;
  };
  ratingSummary: {
    avg:       number;
    total:     number;
    breakdown: Record<number, number>;
  };
}

export interface LiveOrder {
  id:           string;
  customerName: string;
  itemsSummary: string;
  amount:       number;
  status:       'preparing' | 'ready' | 'en_route' | 'delivered' | 'cancelled';
}

export interface TopItem {
  id:          string;
  name:        string;
  category:    string;
  ordersToday: number;
  maxOrders:   number;
  color:       string;
}

export interface ActivityEvent {
  id:        string;
  type:      'order_placed' | 'rider_pickup' | 'new_review' | 'order_cancel' | 'item_change';
  text:      string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class OutletDashboardService {

  getStats(outletId: number | string, _range: 'today' | 'week' | 'month' = 'today'): Observable<OutletDashboardStats> {
    return of({
      ordersToday: 87,
      ordersTodayChange: 12,
      revenueToday: 18450,
      revenueTodayChange: 8,
      avgDeliveryMinutes: 28,
      avgDeliveryChange: -3,
      avgRating: 4.6,
      avgRatingChange: 0.2,
      sparklines: {
        orders:   [52, 61, 45, 78, 65, 80, 87],
        revenue:  [12000, 14500, 10800, 16200, 15100, 17300, 18450],
        delivery: [35, 32, 38, 30, 29, 31, 28],
        rating:   [43, 44, 45, 44, 45, 46, 46],
      },
      weeklyOrders: [
        { day: 'Mon', count: 52 }, { day: 'Tue', count: 61 },
        { day: 'Wed', count: 45 }, { day: 'Thu', count: 78 },
        { day: 'Fri', count: 65 }, { day: 'Sat', count: 80 },
        { day: 'Sun', count: 87 },
      ],
      revenueBreakdown: { foodOrders: 15200, deliveryFees: 2450, tips: 800 },
      deliveryMetrics: {
        onTimePercent: 92,
        avgMinutes: 28,
        fastestMinutes: 14,
        cancelledToday: 3,
        activeRiders: 5,
      },
      ratingSummary: {
        avg: 4.6,
        total: 247,
        breakdown: { 5: 148, 4: 72, 3: 18, 2: 6, 1: 3 },
      },
    }).pipe(delay(400));
  }

  getLiveOrders(outletId: number | string): Observable<LiveOrder[]> {
    return of([
      { id: 'SW-20147', customerName: 'Arun Kumar',    itemsSummary: '2× Biryani · 1× Naan',          amount: 620, status: 'en_route'  },
      { id: 'SW-20146', customerName: 'Priya Sharma',  itemsSummary: '1× Thali · 2× Lassi',            amount: 380, status: 'preparing' },
      { id: 'SW-20145', customerName: 'Karthik Rajan', itemsSummary: '3× Dosa · 1× Filter Coffee',     amount: 210, status: 'ready'     },
      { id: 'SW-20144', customerName: 'Meena Devi',    itemsSummary: '1× Fried Rice · 2× Manchurian',  amount: 480, status: 'delivered' },
      { id: 'SW-20143', customerName: 'Vijay Balan',   itemsSummary: '2× Pizza · 1× Coke',             amount: 720, status: 'cancelled' },
    ] as LiveOrder[]).pipe(delay(300));
  }

  getTopItems(outletId: number | string): Observable<TopItem[]> {
    return of([
      { id: 'i1', name: 'Chicken Biryani', category: 'Main Course', ordersToday: 42, maxOrders: 42, color: '#6366F1' },
      { id: 'i2', name: 'Masala Dosa',     category: 'Breakfast',   ordersToday: 28, maxOrders: 42, color: '#22C55E' },
      { id: 'i3', name: 'Paneer Butter',   category: 'Main Course', ordersToday: 21, maxOrders: 42, color: '#F59E0B' },
      { id: 'i4', name: 'Filter Coffee',   category: 'Beverages',   ordersToday: 19, maxOrders: 42, color: '#3B82F6' },
    ]).pipe(delay(300));
  }

  getRecentActivity(outletId: number | string): Observable<ActivityEvent[]> {
    const now = new Date();
    return of([
      { id: 'a1', type: 'order_placed'  as const, text: 'Order #SW-20147 placed by Arun Kumar',   timestamp: new Date(now.getTime() -  2 * 60000) },
      { id: 'a2', type: 'rider_pickup'  as const, text: 'Rider Suresh picked up order #SW-20146', timestamp: new Date(now.getTime() -  5 * 60000) },
      { id: 'a3', type: 'new_review'    as const, text: 'Priya rated 5★ — "Food was excellent!"', timestamp: new Date(now.getTime() - 12 * 60000) },
      { id: 'a4', type: 'order_cancel'  as const, text: 'Order #SW-20143 cancelled by customer',  timestamp: new Date(now.getTime() - 18 * 60000) },
      { id: 'a5', type: 'item_change'   as const, text: 'Chicken Biryani marked out of stock',    timestamp: new Date(now.getTime() - 35 * 60000) },
    ]).pipe(delay(300));
  }
}
