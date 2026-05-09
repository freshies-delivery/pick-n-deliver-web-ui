import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface DailyOrder {
  date: string;
  consumerOrders: number;
  storeOrders: number;
}

export interface CategoryOrder {
  category: string;
  count: number;
  color: string;
}

export interface RevenueByCity {
  city: string;
  revenue: number;
}

export interface TopOutlet {
  rank: number;
  name: string;
  category: string;
  ordersToday: number;
  rating: number;
}

export interface DashboardStats {
  totalClients: number;
  clientsGrowth: number;
  activeOutlets: number;
  outletsGrowth: number;
  ordersToday: number;
  ordersGrowthPercent: number;
  activeRiders: number;
  riderUtilizationPercent: number;
  dailyOrders: DailyOrder[];
  ordersByCategory: CategoryOrder[];
  revenueByCity: RevenueByCity[];
  topOutlets: TopOutlet[];
}

export interface Activity {
  id: string;
  type: string;
  color: string;
  text: string;
  timestamp: Date;
}

export interface DeliveryMetrics {
  avgDeliveryTimeMins: number;
  avgDeliveryTimePrevMins: number;
  onTimeRatePercent: number;
  onTimeRatePrevPercent: number;
  failedDeliveryRatePercent: number;
  failedDeliveryRatePrevPercent: number;
  sparklineDeliveryTime: number[];
  sparklineOnTime: number[];
  sparklineFailed: number[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getStats(locationIds?: number[] | null): Observable<DashboardStats> {
    return this.http.get<Record<string, unknown>>('mock/dashboard-stats.json').pipe(
      delay(300),
      map((raw) => {
        const stats = this.mapStats(raw);
        if (!locationIds || locationIds.length === 0) return stats;
        return this.filterStatsByLocation(stats, locationIds);
      })
    );
  }

  getActivity(): Observable<Activity[]> {
    return this.http.get<Record<string, unknown>[]>('mock/recent-activity.json').pipe(
      delay(300),
      map((data) => data.map((item) => this.mapActivity(item)))
    );
  }

  getDeliveryMetrics(): Observable<DeliveryMetrics> {
    return this.http.get<Record<string, unknown>>('mock/delivery-metrics.json').pipe(
      delay(350),
      map((raw) => this.mapDeliveryMetrics(raw))
    );
  }

  private filterStatsByLocation(stats: DashboardStats, locationIds: number[]): DashboardStats {
    const factor = locationIds.length === 1 ? 0.17 : 0.47;
    return {
      ...stats,
      totalClients:  Math.round(stats.totalClients  * factor),
      activeOutlets: Math.round(stats.activeOutlets * factor),
      ordersToday:   Math.round(stats.ordersToday   * factor),
      activeRiders:  Math.round(stats.activeRiders  * factor),
      revenueByCity: stats.revenueByCity
        .slice(0, locationIds.length === 1 ? 6 : stats.revenueByCity.length)
        .map((c) => ({ ...c, revenue: Math.round(c.revenue * factor) })),
      dailyOrders: stats.dailyOrders.map((d) => ({
        ...d,
        consumerOrders: Math.round(d.consumerOrders * factor),
        storeOrders:    Math.round(d.storeOrders    * factor)
      }))
    };
  }

  private mapStats(raw: Record<string, unknown>): DashboardStats {
    const dailyOrders = (raw['daily_orders'] as Record<string, unknown>[]).map((d) => ({
      date: d['date'] as string,
      consumerOrders: d['consumer_orders'] as number,
      storeOrders: d['store_orders'] as number
    }));
    const ordersByCategory = (raw['orders_by_category'] as Record<string, unknown>[]).map((d) => ({
      category: d['category'] as string,
      count: d['count'] as number,
      color: d['color'] as string
    }));
    const revenueByCity = (raw['revenue_by_city'] as Record<string, unknown>[]).map((d) => ({
      city: d['city'] as string,
      revenue: d['revenue'] as number
    }));
    const topOutlets = (raw['top_outlets'] as Record<string, unknown>[]).map((d) => ({
      rank: d['rank'] as number,
      name: d['name'] as string,
      category: d['category'] as string,
      ordersToday: d['orders_today'] as number,
      rating: d['rating'] as number
    }));
    return {
      totalClients: raw['total_clients'] as number,
      clientsGrowth: raw['clients_growth'] as number,
      activeOutlets: raw['active_outlets'] as number,
      outletsGrowth: raw['outlets_growth'] as number,
      ordersToday: raw['orders_today'] as number,
      ordersGrowthPercent: raw['orders_growth_percent'] as number,
      activeRiders: raw['active_riders'] as number,
      riderUtilizationPercent: raw['rider_utilization_percent'] as number,
      dailyOrders,
      ordersByCategory,
      revenueByCity,
      topOutlets
    };
  }

  private mapActivity(raw: Record<string, unknown>): Activity {
    return {
      id: raw['id'] as string,
      type: raw['type'] as string,
      color: raw['color'] as string,
      text: raw['text'] as string,
      timestamp: new Date(raw['timestamp'] as string)
    };
  }

  private mapDeliveryMetrics(raw: Record<string, unknown>): DeliveryMetrics {
    return {
      avgDeliveryTimeMins: raw['avg_delivery_time_mins'] as number,
      avgDeliveryTimePrevMins: raw['avg_delivery_time_prev_mins'] as number,
      onTimeRatePercent: raw['on_time_rate_percent'] as number,
      onTimeRatePrevPercent: raw['on_time_rate_prev_percent'] as number,
      failedDeliveryRatePercent: raw['failed_delivery_rate_percent'] as number,
      failedDeliveryRatePrevPercent: raw['failed_delivery_rate_prev_percent'] as number,
      sparklineDeliveryTime: raw['sparkline_delivery_time'] as number[],
      sparklineOnTime: raw['sparkline_on_time'] as number[],
      sparklineFailed: raw['sparkline_failed'] as number[]
    };
  }
}
