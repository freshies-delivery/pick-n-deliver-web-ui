import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { apiUrl } from '../../../core/api.config';
import { AppDashService } from '../../../core/services/app-dash.service';

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
  private readonly dashService = inject(AppDashService);

  constructor(private readonly http: HttpClient) {}

  getDashboard(userId: number): Observable<UserDashData> {
    return this.dashService.getUserDashboard(userId).pipe(
      map(d => this.map(d))
    );
  }

  private map(d: any): UserDashData {
    const topItems: TopItem[] = (d.mostOrderedItems ?? []).map((i: any) => ({
      itemId:   i.itemId,
      itemName: i.name,
      count:    i.orderCount ?? 0,
    }));

    const weeklyData: DailySpend[] = (d.spendingChart ?? []).map((w: any) => ({
      day:    w.day,
      amount: w.revenue ?? 0,
      orders: w.orderCount ?? 0,
    }));

    return {
      kpis: {
        totalOrders:    d.totalOrders    ?? 0,
        totalSpent:     d.totalSpent     ?? 0,
        avgRating:      d.avgRatingGiven ?? 0,
        totalAddresses: d.savedAddresses ?? 0,
        ordersChange:   0,
        spentChange:    0,
      },
      topItems,
      weeklyData,
      recentOrders: d.recentOrders ?? [],
      ratings:      [],
    };
  }
}
