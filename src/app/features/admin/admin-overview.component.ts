import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DashboardService, DashboardStats, Activity, DeliveryMetrics } from './dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, PageHeaderComponent, DatePipe],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit {
  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly activity = signal<Activity[]>([]);
  readonly metrics = signal<DeliveryMetrics | null>(null);

  lineChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  doughnutChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#6b7280', font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } }
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
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { display: false } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    forkJoin({
      stats: this.dashboardService.getStats(),
      activity: this.dashboardService.getActivity(),
      metrics: this.dashboardService.getDeliveryMetrics()
    }).subscribe({
      next: ({ stats, activity, metrics }) => {
        this.stats.set(stats);
        this.activity.set(activity);
        this.metrics.set(metrics);
        this.buildCharts(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildCharts(stats: DashboardStats): void {
    this.lineChartData.set({
      labels: stats.dailyOrders.map((d) => d.date),
      datasets: [
        {
          label: 'Consumer Orders',
          data: stats.dailyOrders.map((d) => d.consumerOrders),
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#22C55E'
        },
        {
          label: 'Store Orders',
          data: stats.dailyOrders.map((d) => d.storeOrders),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3B82F6'
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

    this.barChartData.set({
      labels: stats.revenueByCity.map((r) => r.city),
      datasets: [{
        label: 'Revenue (₹)',
        data: stats.revenueByCity.map((r) => r.revenue),
        backgroundColor: '#22C55E',
        borderRadius: 6,
        hoverBackgroundColor: '#4ADE80'
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
