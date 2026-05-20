import { Component, OnDestroy, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { Subscription, switchMap } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { DashboardStats } from './dashboard.service';
import { LocationService } from '../../core/services/location.service';
import { AppDashService } from '../../core/services/app-dash.service';

Chart.register(...registerables);

const SEGMENT_COLORS = [
  '#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899',
  '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
];

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, PageHeaderComponent, DatePipe],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  private readonly dashService   = inject(AppDashService);
  private readonly modalService  = inject(ModalService);
  readonly locationService       = inject(LocationService);

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Generate Report', icon: 'download', type: 'secondary',
      action: () => this.modalService.openReport({
        type: 'location',
        label: 'All Locations',
        locationIds: this.locationService.selectedIds(),
      }).subscribe(),
    },
  ];

  readonly loading   = signal(true);
  readonly stats     = signal<DashboardStats | null>(null);
  readonly activity  = signal<any[]>([]);
  readonly metrics   = signal<any | null>(null);
  readonly dateRange = signal<'today' | 'week' | 'month'>('today');
  readonly sortCol   = signal<string>('ordersToday');
  readonly sortDir   = signal<'asc' | 'desc'>('desc');

  readonly DATE_RANGES: { key: 'today' | 'week' | 'month'; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  readonly OUTLET_CITIES: Record<number, string> = {
    1: 'Chennai', 2: 'Bengaluru', 3: 'Mumbai', 4: 'Delhi', 5: 'Hyderabad',
    6: 'Chennai', 7: 'Bengaluru', 8: 'Mumbai', 9: 'Delhi', 10: 'Hyderabad',
  };

  readonly sortedOutlets = computed(() => {
    const outlets = this.stats()?.topOutlets ?? [];
    const col     = this.sortCol();
    const dir     = this.sortDir();
    return [...outlets].sort((a, b) => {
      const av = (a as any)[col] ?? 0;
      const bv = (b as any)[col] ?? 0;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  sortBy(col: string): void {
    if (this.sortCol() === col) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('desc');
    }
  }

  outletCity(rank: number): string {
    return this.OUTLET_CITIES[rank] ?? 'Chennai';
  }

  lineChartData    = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  doughnutChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  barChartData     = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  readonly pageSubtitle = computed(() => {
    const sel = this.locationService.selected();
    if (sel.length === 0) return 'Showing data across all locations';
    if (sel.length === 1) return `Showing data for ${sel[0].name} — by area`;
    return `Aggregated view across ${sel.length} selected locations`;
  });

  readonly isAllLocations    = this.locationService.isAllSelected;
  readonly selectedLocations = this.locationService.selected;

  private readonly AREA_MAP: Record<number, string[]> = {
    166: ['Nungambakkam', 'T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Others'],
    167: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Others'],
    168: ['Bandra', 'Andheri', 'Powai', 'Thane', 'Dadar', 'Others'],
    169: ['Connaught Pl.', 'Hauz Khas', 'Dwarka', 'Rohini', 'Saket', 'Others'],
    170: ['Gachibowli', 'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Kukatpally', 'Others'],
    171: ['Koregaon Park', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Baner', 'Others']
  };

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#6b7280', font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(128,128,128,0.1)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(128,128,128,0.1)' } }
    }
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#6b7280', font: { size: 12 } } }
    }
  };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { display: false } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(128,128,128,0.1)' } }
    }
  };

  private readonly stats$ = toObservable(this.locationService.selectedIds).pipe(
    switchMap(ids => {
      return this.dashService.getGlobalStats(ids.length > 0 ? ids : undefined);
    })
  );

  private statsSub?: Subscription;

  ngOnInit(): void {
    this.statsSub = this.stats$.subscribe({
      next: (raw) => {
        const stats = this.mapToOldFormat(raw);
        this.stats.set(stats);
        this.buildCharts(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
  }

  private mapToOldFormat(raw: any): DashboardStats {
    return {
      totalClients:            raw?.totalClients            ?? 0,
      clientsGrowth:           0,
      activeOutlets:           raw?.activeOutlets?.rawValue ?? raw?.activeOutlets ?? 0,
      outletsGrowth:           0,
      ordersToday:             raw?.ordersToday?.rawValue   ?? raw?.ordersToday   ?? 0,
      ordersGrowthPercent:     raw?.ordersToday?.changePercent ?? 0,
      activeRiders:            0,
      riderUtilizationPercent: 0,
      dailyOrders: (raw?.dailyOrders ?? []).map((d: any) => ({
        date:           d.day ?? d.date ?? '',
        consumerOrders: d.orderCount ?? 0,
        storeOrders:    0,
      })),
      ordersByCategory: (raw?.ordersBySegment ?? []).map((s: any, i: number) => ({
        category: s.name  ?? `Segment ${i + 1}`,
        count:    s.count ?? 0,
        color:    SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      })),
      revenueByCity: (raw?.revenueByCity ?? []).map((c: any) => ({
        city:    c.city,
        revenue: c.revenue,
      })),
      topOutlets: (raw?.topOutlets ?? []).map((o: any, i: number) => ({
        rank:        i + 1,
        name:        o.name,
        category:    o.clientName ?? '',
        ordersToday: o.ordersToday ?? 0,
        rating:      o.avgRating  ?? 0,
      })),
    };
  }

  getRevenueSectionLabel(): string {
    const sel = this.locationService.selected();
    if (sel.length === 0) return 'All cities';
    if (sel.length === 1) return `Areas in ${sel[0].name}`;
    return sel.map(l => l.name).join(', ');
  }

  private getRevenueLabels(stats: DashboardStats): string[] {
    const sel = this.locationService.selected();
    if (sel.length === 1) {
      const areas = this.AREA_MAP[sel[0].id];
      if (areas) return areas.slice(0, stats.revenueByCity.length);
    }
    return stats.revenueByCity.map(r => r.city);
  }

  private buildCharts(stats: DashboardStats): void {
    this.lineChartData.set({
      labels: stats.dailyOrders.map(d => d.date),
      datasets: [
        {
          label: 'Consumer Orders',
          data: stats.dailyOrders.map(d => d.consumerOrders),
          borderColor: '#2997FF',
          backgroundColor: 'rgba(41,151,255,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2997FF'
        },
        {
          label: 'Store Orders',
          data: stats.dailyOrders.map(d => d.storeOrders),
          borderColor: '#32D74B',
          backgroundColor: 'rgba(50,215,75,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#32D74B'
        }
      ]
    });

    this.doughnutChartData.set({
      labels: stats.ordersByCategory.map(c => c.category),
      datasets: [{
        data: stats.ordersByCategory.map(c => c.count),
        backgroundColor: stats.ordersByCategory.map(c => c.color),
        borderWidth: 0,
        hoverOffset: 6
      }]
    });

    const revenueLabels = this.getRevenueLabels(stats);
    this.barChartData.set({
      labels: revenueLabels,
      datasets: [{
        label: 'Revenue (₹)',
        data: stats.revenueByCity.map(r => r.revenue),
        backgroundColor: '#2997FF',
        borderRadius: 6,
        hoverBackgroundColor: '#34AADC'
      }]
    });
  }

  trend(current: number, previous: number): 'up' | 'down' | 'flat' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'flat';
  }

  trendLabel(current: number, previous: number, suffix = ''): string {
    const diff = current - previous;
    const sign = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    return `${sign} ${Math.abs(diff)}${suffix} vs last period`;
  }

  sparklineMax(values: number[]): number {
    return Math.max(...values);
  }
}
