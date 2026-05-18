import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface UserDashKpis {
  totalOrders:   number;
  totalSpent:    number;
  avgRating:     number;
  totalAddresses: number;
  ordersChange:  number;
  spentChange:   number;
}

export interface TopItem {
  itemId:   number;
  itemName: string;
  count:    number;
}

export interface DailySpend {
  day:    string;
  amount: number;
  orders: number;
}

export interface UserDashData {
  kpis:       UserDashKpis;
  topItems:   TopItem[];
  weeklyData: DailySpend[];
  recentOrders: any[];
  ratings:    any[];
}

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  constructor(private readonly http: HttpClient) {}

  getDashboard(userId: number): Observable<UserDashData> {
    const ordersParams = new HttpParams().set('userId', String(userId));
    const ratingsUrl   = apiUrl(`/api/ratings/user`);

    return forkJoin({
      orders:    this.http.get<any[]>(apiUrl('/api/orders'), { params: ordersParams }),
      ratings:   this.http.get<any[]>(ratingsUrl, { params: new HttpParams().set('userId', String(userId)) }),
      addresses: this.http.get<any[]>(apiUrl('/api/addresses'), { params: new HttpParams().set('userId', String(userId)) }),
    }).pipe(map(({ orders, ratings, addresses }) => this.build(orders, ratings, addresses)));
  }

  private build(orders: any[], ratings: any[], addresses: any[]): UserDashData {
    const totalSpent = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const avgRating  = ratings.length
      ? ratings.reduce((s, r) => s + (r.score ?? 0), 0) / ratings.length
      : 0;

    // Top items from orderItems
    const itemMap = new Map<number, { name: string; count: number }>();
    for (const o of orders) {
      for (const oi of (o.orderItems ?? [])) {
        const id = oi.itemId;
        const existing = itemMap.get(id);
        if (existing) {
          existing.count += oi.quantity ?? 1;
        } else {
          itemMap.set(id, { name: oi.itemName ?? `Item #${id}`, count: oi.quantity ?? 1 });
        }
      }
    }
    const topItems: TopItem[] = Array.from(itemMap.entries())
      .map(([itemId, { name, count }]) => ({ itemId, itemName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Weekly spend (last 7 days)
    const now   = new Date();
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const weeklyData: DailySpend[] = days7.map(d => {
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dayOrders = orders.filter(o => {
        if (!o.createdTime) return false;
        const od = new Date(o.createdTime);
        return od.getFullYear() === d.getFullYear() &&
               od.getMonth() === d.getMonth() &&
               od.getDate() === d.getDate();
      });
      return {
        day:    label,
        amount: dayOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
        orders: dayOrders.length,
      };
    });

    const recentOrders = [...orders]
      .sort((a, b) => (b.orderId ?? 0) - (a.orderId ?? 0))
      .slice(0, 5);

    return {
      kpis: {
        totalOrders:    orders.length,
        totalSpent,
        avgRating,
        totalAddresses: addresses.length,
        ordersChange:   0,
        spentChange:    0,
      },
      topItems,
      weeklyData,
      recentOrders,
      ratings: ratings.slice(0, 5),
    };
  }
}
