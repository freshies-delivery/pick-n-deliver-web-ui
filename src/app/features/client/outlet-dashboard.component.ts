import {
  Component,
  Input,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  OutletDashboardService,
  OutletDashboardStats,
  LiveOrder,
  TopItem,
  ActivityEvent,
} from './services/outlet-dashboard.service';

@Component({
  selector: 'app-outlet-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './outlet-dashboard.component.html',
  styleUrl: './outlet-dashboard.component.scss',
})
export class OutletDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly svc = inject(OutletDashboardService);

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

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      stats:    this.svc.getStats(this.outletId),
      orders:   this.svc.getLiveOrders(this.outletId),
      items:    this.svc.getTopItems(this.outletId),
      activity: this.svc.getRecentActivity(this.outletId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(d => {
        this.stats.set(d.stats);
        this.liveOrders.set(d.orders);
        this.topItems.set(d.items);
        this.recentActivity.set(d.activity);
        this.lastRefreshed.set(new Date());
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
    const d = new Date().getDay();
    const dayMap = [1, 2, 3, 4, 5, 6, 0];
    return dayMap[idx] === d;
  }

  revenueBarWidth(val: number): number {
    const t = this.revenueTotal();
    return t === 0 ? 0 : Math.round((val / t) * 100);
  }

  activityDot(type: ActivityEvent['type']): string {
    const m: Record<string, string> = {
      order_placed:  '#22C55E',
      rider_pickup:  '#3B82F6',
      new_review:    '#F59E0B',
      order_cancel:  '#F43F5E',
      item_change:   '#A855F7',
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
