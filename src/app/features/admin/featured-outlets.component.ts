import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { AppDashService } from '../../core/services/app-dash.service';

interface FeaturedOutletRow {
  featuredOutletId: number;
  outletId: number;
  outletName: string;
  imageUrl: string | null;
  type: string | null;
  displayOrder: number;
  isActive: boolean;
}

@Component({
  selector: 'app-featured-outlets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, StatsStripComponent, SkeletonListComponent, EmptyStateComponent],
  templateUrl: './featured-outlets.component.html',
  styleUrl: './featured-outlets.component.scss',
})
export class FeaturedOutletsComponent implements OnInit {
  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly rows     = signal<FeaturedOutletRow[]>([]);
  readonly addingOutletId = signal('');

  readonly activeCount = computed(() => this.rows().filter(r => r.isActive).length);

  readonly statsStrip = computed((): StripStat[] => [
    {
      value: this.rows().length,
      label: 'Total Featured',
      iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z',
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#6366f1',
    },
    {
      value: this.activeCount(),
      label: 'Active',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#22c55e',
      valueColor: '#22c55e',
    },
    {
      value: this.rows().length - this.activeCount(),
      label: 'Inactive',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: '#ef4444',
      valueColor: '#ef4444',
    },
  ]);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Outlet', icon: 'add', type: 'primary', action: () => this.promptAdd() },
  ];

  private readonly toast   = inject(ToastService);
  private readonly modal   = inject(ModalService);
  private readonly dash    = inject(AppDashService);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.dash.getFeaturedOutlets()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: any[]) => this.rows.set(data ?? []),
        error: () => this.toast.error('Failed to load featured outlets'),
      });
  }

  promptAdd(): void {
    const outletIdStr = prompt('Enter the Outlet ID to feature:');
    if (!outletIdStr || isNaN(Number(outletIdStr))) return;
    const outletId = Number(outletIdStr);
    this.saving.set(true);
    this.dash.addFeaturedOutlet(outletId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => { this.toast.success('Outlet added to featured'); this.load(); },
        error: () => this.toast.error('Failed to add outlet — it may already be featured'),
      });
  }

  toggleActive(row: FeaturedOutletRow): void {
    const next = !row.isActive;
    this.dash.updateFeaturedOutlet(row.featuredOutletId, { isActive: next }).subscribe({
      next: () => {
        this.rows.update(rs => rs.map(r => r.featuredOutletId === row.featuredOutletId ? { ...r, isActive: next } : r));
        this.toast.success(next ? 'Outlet activated' : 'Outlet deactivated');
      },
      error: () => this.toast.error('Failed to update'),
    });
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const rs = [...this.rows()];
    [rs[index - 1], rs[index]] = [rs[index], rs[index - 1]];
    this.rows.set(rs);
    this.saveOrder(rs);
  }

  moveDown(index: number): void {
    const rs = [...this.rows()];
    if (index >= rs.length - 1) return;
    [rs[index], rs[index + 1]] = [rs[index + 1], rs[index]];
    this.rows.set(rs);
    this.saveOrder(rs);
  }

  private saveOrder(rs: FeaturedOutletRow[]): void {
    const ids = rs.map(r => r.featuredOutletId);
    this.dash.reorderFeaturedOutlets(ids).subscribe({
      error: () => this.toast.error('Failed to save order'),
    });
  }

  confirmDelete(row: FeaturedOutletRow): void {
    this.modal.openConfirm({
      title: 'Remove from Featured',
      message: `Remove "${row.outletName}" from the featured carousel?`,
    }).subscribe(ok => {
      if (!ok) return;
      this.dash.deleteFeaturedOutlet(row.featuredOutletId).subscribe({
        next: () => { this.toast.success('Outlet removed from featured'); this.load(); },
        error: () => this.toast.error('Failed to remove outlet'),
      });
    });
  }
}
