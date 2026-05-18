import {
  Component, Input, OnInit, OnDestroy,
  DestroyRef, inject, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  OutletDashboardStats, LiveOrder, TopItem, ActivityEvent
} from './services/outlet-dashboard.service';
import { AppDashService } from '../../core/services/app-dash.service';
import { ToastService } from '../../core/services/toast.service';

const STATUS_MAP: Record<number, LiveOrder['status']> = {
  0: 'preparing', 1: 'preparing', 2: 'en_route', 3: 'delivered', 4: 'cancelled'
};
const ITEM_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'];
const EVENT_TYPE_MAP: Record<string, ActivityEvent['type']> = {
  ORDER_PLACED: 'order_placed', RIDER_PICKUP: 'rider_pickup',
  NEW_REVIEW:   'new_review',   ORDER_CANCEL: 'order_cancel', ITEM_CHANGE: 'item_change'
};

@Component({
  selector: 'app-outlet-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './outlet-dashboard.component.html',
  styleUrl: './outlet-dashboard.component.scss',
})
export class OutletDashboardComponent implements OnInit, OnDestroy {
  private readonly destroyRef   = inject(DestroyRef);
  private readonly dashService  = inject(AppDashService);
  private readonly toastService = inject(ToastService);

  @Input({ required: true }) outletId!: number;

  readonly stats          = signal<OutletDashboardStats | null>(null);
  readonly liveOrders     = signal<LiveOrder[]>([]);
  readonly topItems       = signal<TopItem[]>([]);
  readonly recentActivity = signal<ActivityEvent[]>([]);
  readonly loading        = signal(true);
  readonly lastRefreshed  = signal<Date>(new Date());

  readonly activeCount = computed(() =>
    this.liveOrders().filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
  );

  readonly revenueTotal = computed(() => {
    const b = this.stats()?.revenueBreakdown;
    return b ? b.foodOrders + b.deliveryFees + b.tips : 1;
  });

  readonly CIRCUMFERENCE = 2 * Math.PI * 26;

  ngOnInit(): void {
    this.loadAll();
    interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void {}

  loadAll(): void {
    this.loading.set(true);
    this.dashService.getOutletDashboard(this.outletId, 'today')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: d => {
          if (!d) return;

          const topItemsList: TopItem[] = (d.topItems ?? []).map((item: any, i: number) => ({
            id:          String(item.itemId),
            name:        item.name,
            category:    item.categoryName ?? '',
            ordersToday: item.ordersToday  ?? 0,
            maxOrders:   Math.max(...(d.topItems ?? []).map((x: any) => x.ordersToday ?? 0), 1),
            color:       ITEM_COLORS[i % ITEM_COLORS.length],
          }));

          const stats: OutletDashboardStats = {
            ordersToday:        d.ordersToday  ?? 0,
            ordersTodayChange:  0,
            revenueToday:       d.revenueToday ?? 0,
            revenueTodayChange: 0,
            avgDeliveryMinutes: 0,
            avgDeliveryChange:  0,
            avgRating:          d.avgRating    ?? 0,
            avgRatingChange:    0,
            sparklines:        { orders: [], revenue: [], delivery: [], rating: [] },
            weeklyOrders:      [],
            revenueBreakdown:  { foodOrders: d.revenueToday ?? 0, deliveryFees: 0, tips: 0 },
            deliveryMetrics:   { onTimePercent: 0, avgMinutes: 0, fastestMinutes: 0, cancelledToday: 0, activeRiders: 0 },
            ratingSummary:     { avg: d.avgRating ?? 0, total: d.ratingCount ?? 0, breakdown: {} },
          };
          this.stats.set(stats);

          this.liveOrders.set([]);

          this.topItems.set(topItemsList);

          const activity: ActivityEvent[] = (d.recentRatings ?? []).map((r: any, i: number) => ({
            id:        String(r.ratingId ?? i),
            type:      'new_review' as ActivityEvent['type'],
            text:      `${r.userName ?? 'Someone'} rated ${r.score}★${r.comment ? ` — "${r.comment}"` : ''}`,
            timestamp: new Date(r.createdAt ?? Date.now()),
          }));
          this.recentActivity.set(activity);
          this.lastRefreshed.set(new Date());
        },
        error: () => this.toastService.error('Failed to load dashboard')
      });
  }

  sparklineHeight(val: number, data: number[]): number {
    const max = Math.max(...data);
    return max === 0 ? 4 : Math.max(4, Math.round((val / max) * 24));
  }

  weeklyBarHeight(count: number, weekly: { day: string; count: number }[]): number {
    const max = Math.max(...weekly.map(w => w.count));
    return max === 0 ? 8 : Math.max(8, Math.round((count / max) * 72));
  }

  isToday(idx: number): boolean {
    const d      = new Date().getDay();
    const dayMap = [1, 2, 3, 4, 5, 6, 0];
    return dayMap[idx] === d;
  }

  revenueBarWidth(val: number): number {
    const t = this.revenueTotal();
    return t === 0 ? 0 : Math.round((val / t) * 100);
  }

  activityDot(type: ActivityEvent['type']): string {
    const m: Record<string, string> = {
      order_placed: '#22C55E', rider_pickup: '#3B82F6',
      new_review:   '#F59E0B', order_cancel: '#F43F5E', item_change: '#A855F7',
    };
    return m[type] ?? '#6B7280';
  }

  formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }

  formatRevenue(val: number): string {
    return '₹' + val.toLocaleString('en-IN');
  }

  ratingBarWidth(star: number): number {
    const s = this.stats()?.ratingSummary;
    if (!s || s.total === 0) return 0;
    return Math.round(((s.breakdown[star] ?? 0) / s.total) * 100);
  }

  dashOffset(percent: number): number {
    return this.CIRCUMFERENCE - (percent / 100) * this.CIRCUMFERENCE;
  }

  starFilled(star: number, rating: number): boolean {
    return star <= Math.round(rating);
  }

  itemBarWidth(item: TopItem): number {
    return item.maxOrders === 0 ? 0 : Math.round((item.ordersToday / item.maxOrders) * 100);
  }

  readonly stars = [1, 2, 3, 4, 5];
}
