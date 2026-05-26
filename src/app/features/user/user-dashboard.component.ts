import {
  Component, OnInit, computed, signal,
  ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { UserContextService } from '../../core/services/user-context.service';
import { UserDashboardService, UserDashData } from './services/user-dashboard.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, StatusBadgeComponent, DecimalPipe, RouterLink, RouterLinkActive],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  readonly userId    = signal(0);
  readonly loading   = signal(true);
  readonly dash      = signal<UserDashData | null>(null);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  private readonly userContext    = inject(UserContextService);
  private readonly dashService    = inject(UserDashboardService);
  private readonly modalService   = inject(ModalService);
  private readonly route          = inject(ActivatedRoute);

  readonly headerActions: PageHeaderAction[] = [];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
    this.headerActions.push({
      label: 'Generate Report', icon: 'download', type: 'secondary',
      action: () => this.modalService.openReport({
        type: 'user', entityId: this.userId(),
        label: this.userLabel(),
      }).subscribe(),
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.dashService.getDashboard(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: d => this.dash.set(d) });
  }

  formatAmount(v: number): string {
    return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  itemBarWidth(item: any): number {
    const max = this.dash()?.topItems[0]?.count ?? 1;
    return Math.round((item.count / max) * 100);
  }

  weeklyMax(): number {
    return Math.max(...(this.dash()?.weeklyData.map(d => d.amount) ?? [1]), 1);
  }

  weeklyBarHeight(v: number): number {
    return Math.round((v / this.weeklyMax()) * 52);
  }

  stars(score: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  starFilled(s: number, avg: number): boolean {
    return s <= Math.round(avg);
  }

  ratingCountFor(score: number): number {
    return (this.dash()?.ratings ?? []).filter((r: any) => r.score === score).length;
  }

  ratingBarWidth(score: number): number {
    const total = (this.dash()?.ratings ?? []).length;
    if (!total) return 0;
    return Math.round((this.ratingCountFor(score) / total) * 100);
  }

  accentColor(status?: string): string {
    const map: Record<string, string> = {
      placed:           '#38BDF8',
      accepted:         '#67E8F9',
      preparing:        '#F59E0B',
      ready:            '#8B5CF6',
      ready_for_pickup: '#8B5CF6',
      picked_up:        '#3B82F6',
      out_for_delivery: '#6366F1',
      delivered:        '#22C55E',
      completed:        '#22C55E',
      cancelled:        '#F43F5E',
      // legacy
      pending:          '#F59E0B',
      in_progress:      '#3B82F6',
      on_the_way:       '#6366F1',
    };
    return map[(status ?? '').toLowerCase()] ?? '#6366F1';
  }

  itemColor(idx: number): string {
    const colors = ['#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
    return colors[idx % colors.length];
  }
}
