import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { Subscription, switchMap } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DashboardService, DashboardStats, Activity, DeliveryMetrics } from './dashboard.service';
import { LocationService } from '../../core/services/location.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, PageHeaderComponent, DatePipe],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  readonly locationService = inject(LocationService);

  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly activity = signal<Activity[]>([]);
  readonly metrics = signal<DeliveryMetrics | null>(null);

  lineChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  doughnutChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  readonly pageSubtitle = computed(() => {
    const sel = this.locationService.selected();
    if (sel.length === 0) return 'Showing data across all locations';
    if (sel.length === 1) return `Showing data for ${sel[0].name} — by area`;
    return `Aggregated view across ${sel.length} selected locations`;
  });

  readonly isAllLocations = this.locationService.isAllSelected;
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
    switchMap((ids) => this.dashboardService.getStats(ids.length === 0 ? null : ids))
  );

  private statsSub?: Subscription;
  private activitySub?: Subscription;
  private metricsSub?: Subscription;

  ngOnInit(): void {
    this.activitySub = this.dashboardService.getActivity().subscribe((a) => this.activity.set(a));
    this.metricsSub = this.dashboardService.getDeliveryMetrics().subscribe((m) => this.metrics.set(m));

    this.statsSub = this.stats$.subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.buildCharts(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
    this.activitySub?.unsubscribe();
    this.metricsSub?.unsubscribe();
  }

  getRevenueSectionLabel(): string {
    const sel = this.locationService.selected();
    if (sel.length === 0) return 'All cities';
    if (sel.length === 1) return `Areas in ${sel[0].name}`;
    return sel.map((l) => l.name).join(', ');
  }

  private getRevenueLabels(stats: DashboardStats): string[] {
    const sel = this.locationService.selected();
    if (sel.length === 1) {
      const areas = this.AREA_MAP[sel[0].id];
      if (areas) return areas.slice(0, stats.revenueByCity.length);
    }
    return stats.revenueByCity.map((r) => r.city);
  }

  private buildCharts(stats: DashboardStats): void {
    this.lineChartData.set({
      labels: stats.dailyOrders.map((d) => d.date),
      datasets: [
        {
          label: 'Consumer Orders',
          data: stats.dailyOrders.map((d) => d.consumerOrders),
          borderColor: '#2997FF',
          backgroundColor: 'rgba(41,151,255,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2997FF'
        },
        {
          label: 'Store Orders',
          data: stats.dailyOrders.map((d) => d.storeOrders),
          borderColor: '#32D74B',
          backgroundColor: 'rgba(50,215,75,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#32D74B'
        }
      ]
    });

    this.doughnutChartData.set({
      labels: stats.ordersByCategory.map((c) => c.category),
      datasets: [{
        data: stats.ordersByCategory.map((c) => c.count),
        backgroundColor: stats.ordersByCategory.map((c) => c.color),
        borderWidth: 0,
        hoverOffset: 6
      }]
    });

    const revenueLabels = this.getRevenueLabels(stats);
    this.barChartData.set({
      labels: revenueLabels,
      datasets: [{
        label: 'Revenue (₹)',
        data: stats.revenueByCity.map((r) => r.revenue),
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
