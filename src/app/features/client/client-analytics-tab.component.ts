import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { AppDashService } from '../../core/services/app-dash.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { AppDashClientAnalyticsDto } from '../../core/models/app-dash.models';

@Component({
  selector: 'app-client-analytics-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, SkeletonListComponent,
    RouterLink, RouterLinkActive, DecimalPipe,
  ],
  templateUrl: './client-analytics-tab.component.html',
  styleUrl: './client-analytics-tab.component.scss',
})
export class ClientAnalyticsTabComponent implements OnInit {
  readonly clientId   = signal(0);
  readonly loading    = signal(true);
  readonly analytics  = signal<AppDashClientAnalyticsDto | null>(null);
  readonly range      = signal<string>('7d');
  readonly clientName = signal('');

  readonly RANGES = [
    { key: '7d',  label: '7 Days'  },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ];

  private readonly dashService = inject(AppDashService);
  private readonly hierService = inject(HierarchyStateService);
  private readonly route       = inject(ActivatedRoute);
  private readonly destroyRef  = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('clientId'));
    this.clientId.set(id);
    this.clientName.set(this.hierService.state.clientName ?? 'Client');
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.dashService.getClientAnalytics(this.clientId(), this.range())
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.analytics.set(d) });
  }

  setRange(r: string): void {
    this.range.set(r);
    this.load();
  }

  trendClass(v: number): string {
    return v > 0 ? 'trend-up' : v < 0 ? 'trend-down' : 'trend-flat';
  }

  trendIcon(v: number): string {
    return v > 0 ? '↑' : v < 0 ? '↓' : '→';
  }

  revenueMax(): number {
    return Math.max(...(this.analytics()?.weeklyRevenue?.map(w => w.revenue) ?? [1]), 1);
  }

  ordersMax(): number {
    return Math.max(...(this.analytics()?.weeklyOrders?.map(w => w.orderCount) ?? [1]), 1);
  }

  revenueBarHeight(v: number): number {
    return Math.round((v / this.revenueMax()) * 60);
  }

  ordersBarHeight(v: number): number {
    return Math.round((v / this.ordersMax()) * 60);
  }
}
