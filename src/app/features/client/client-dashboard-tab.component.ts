import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { AppDashService } from '../../core/services/app-dash.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { ModalService } from '../../core/services/modal.service';
import {
  AppDashClientDashboardDto, AppDashOrderRowDto,
  AppDashOutletTopRowDto, AppDashWeeklyTrendDto,
} from '../../core/models/app-dash.models';

@Component({
  selector: 'app-client-dashboard-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, StatsStripComponent, SkeletonListComponent,
    DecimalPipe, DatePipe,
    RouterLink, RouterLinkActive,
  ],
  templateUrl: './client-dashboard-tab.component.html',
  styleUrl: './client-dashboard-tab.component.scss',
})
export class ClientDashboardTabComponent implements OnInit {
  readonly clientId   = signal(0);
  readonly loading    = signal(true);
  readonly dash       = signal<AppDashClientDashboardDto | null>(null);
  readonly clientName = signal('');

  readonly statsStrip = computed((): StripStat[] => {
    const d = this.dash();
    return [
      {
        value: d?.totalOrders ?? 0,
        label: 'Total Orders',
        iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2',
        iconBg: 'rgba(99,102,241,0.15)', iconColor: '#A5B4FC',
      },
      {
        value: '₹' + (d?.totalRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
        label: 'Total Revenue',
        iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(245,158,11,0.15)', iconColor: '#FCD34D', valueColor: '#FCD34D',
      },
      {
        value: d?.activeOutlets ?? 0,
        label: 'Outlets',
        iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6',
        iconBg: 'rgba(52,211,153,0.15)', iconColor: '#6EE7B7', valueColor: '#6EE7B7',
      },
      {
        value: (d?.avgRating ?? 0).toFixed(1),
        label: 'Avg Rating',
        iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z',
        iconBg: 'rgba(251,146,60,0.15)', iconColor: '#FDBA74', valueColor: '#FDBA74',
      },
    ];
  });

  private readonly dashService   = inject(AppDashService);
  private readonly hierService   = inject(HierarchyStateService);
  private readonly modalService  = inject(ModalService);
  private readonly route         = inject(ActivatedRoute);
  private readonly destroyRef    = inject(DestroyRef);

  readonly headerActions: PageHeaderAction[] = [];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('clientId'));
    this.clientId.set(id);
    this.clientName.set(this.hierService.state.clientName ?? 'Client');
    this.headerActions.push({
      label: 'Generate Report', icon: 'download', type: 'secondary',
      action: () => this.openReport(),
    });
  }

  openReport(): void {
    this.modalService.openReport({
      type: 'client',
      entityId: this.clientId(),
      label: this.clientName(),
    }).subscribe();
  }

  ngOnInit(): void {
    this.dashService.getClientDashboard(this.clientId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: d => this.dash.set(d) });
  }

  statusLabel(code: number): string {
    return ['Pending', 'Confirmed', 'En Route', 'Delivered', 'Cancelled'][code] ?? 'Unknown';
  }

  statusClass(code: number): string {
    return ['status-pending', 'status-confirmed', 'status-enroute', 'status-delivered', 'status-cancelled'][code] ?? '';
  }

  weeklyMax(): number {
    return Math.max(...(this.dash()?.weeklyRevenue?.map(w => w.revenue) ?? [1]), 1);
  }

  weeklyBarHeight(v: number): number {
    return Math.round((v / this.weeklyMax()) * 52);
  }

  outletBarWidth(o: AppDashOutletTopRowDto): number {
    const max = this.dash()?.topOutlets?.[0]?.ordersThisMonth ?? 1;
    return max ? Math.round((o.ordersThisMonth / max) * 100) : 0;
  }

  getStarCount(star: number): number {
    const rs = this.dash()?.ratingSummary;
    if (!rs) return 0;
    const map: Record<number, number> = {
      5: rs.fiveStarCount  ?? 0,
      4: rs.fourStarCount  ?? 0,
      3: rs.threeStarCount ?? 0,
      2: rs.twoStarCount   ?? 0,
      1: rs.oneStarCount   ?? 0,
    };
    return map[star] ?? 0;
  }
}
