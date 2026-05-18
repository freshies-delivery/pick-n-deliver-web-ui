import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Segment } from './segment.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';

const SEGMENT_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

@Component({
  selector: 'app-segments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, StatsStripComponent, PageToolbarComponent,
    RichListItemComponent, SkeletonListComponent, EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './segments.component.html',
  styleUrl: './segments.component.scss'
})
export class SegmentsComponent implements OnInit {
  readonly loading      = signal(true);
  readonly segments     = signal<Segment[]>([]);
  readonly activeFilter = signal('all');
  readonly searchQuery  = signal('');
  readonly currentPage  = signal(1);
  readonly pageSize     = 10;

  readonly filteredSegments = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    return this.segments().filter(s => {
      const matchesFilter =
        f === 'all' ||
        (f === 'active'   && s.isActive)  ||
        (f === 'inactive' && !s.isActive);
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.criteriaReadable.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  readonly pagedSegments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSegments().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all      = this.segments();
    const active   = all.filter(s => s.isActive).length;
    const inactive = all.filter(s => !s.isActive).length;
    const total    = all.reduce((sum, s) => sum + s.userCount, 0);
    return [
      { value: all.length,          label: 'Total Segments', iconPath: 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z', iconBg: 'rgba(99,102,241,0.15)',  iconColor: '#6366f1' },
      { value: active,              label: 'Active',         iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22c55e', valueColor: '#22c55e' },
      { value: inactive,            label: 'Inactive',       iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', iconBg: 'rgba(156,163,175,0.15)', iconColor: '#9ca3af' },
      { value: total.toLocaleString(), label: 'Total Clients', iconPath: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3b82f6', valueColor: '#3b82f6' }
    ];
  });

  readonly filterOptions = computed((): FilterOption[] => [
    { value: 'all',      label: 'All',      count: this.segments().length },
    { value: 'active',   label: 'Active',   count: this.segments().filter(s => s.isActive).length },
    { value: 'inactive', label: 'Inactive', count: this.segments().filter(s => !s.isActive).length }
  ]);

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  private readonly dashService  = inject(AppDashService);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Create Segment', icon: 'add', type: 'primary', action: () => this.openCreate() }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dashService.getSegments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: segs => {
          const mapped: Segment[] = (segs ?? []).map((s: any, i: number) => ({
            id:               String(s.segmentId),
            name:             s.name,
            description:      s.description ?? '',
            criteria:         s.segmentUri  ?? '',
            criteriaReadable: `${s.clientCount ?? 0} clients · ${s.outletCount ?? 0} outlets`,
            userCount:        s.clientCount  ?? 0,
            isActive:         true,
            createdAt:        new Date(),
            color:            SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          }));
          this.segments.set(mapped);
        },
        error: () => this.toastService.error('Failed to load segments')
      });
  }

  openCreate(): void {
    this.modalService.openAddSegment().subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:        value.name,
        description: value.description ?? '',
        segmentUri:  value.segment_uri  ?? '',
        priority:    value.priority     ?? 0,
        parentId:    value.parent_id    ?? null,
      };
      this.dashService.createSegment(dto).subscribe({
        next: () => { this.toastService.success('Segment created'); this.load(); },
        error: () => this.toastService.error('Failed to create segment'),
      });
    });
  }

  openEdit(seg: Segment): void {
    this.modalService.openEditSegment(seg as unknown as Record<string, unknown>).subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:        value.name ?? seg.name,
        description: value.description ?? seg.description ?? '',
        segmentUri:  value.segment_uri  ?? seg.criteria   ?? '',
        priority:    value.priority     ?? 0,
        parentId:    value.parent_id    ?? null,
      };
      this.dashService.updateSegment(Number(seg.id), dto).subscribe({
        next: () => { this.toastService.success('Segment updated'); this.load(); },
        error: () => this.toastService.error('Failed to update segment'),
      });
    });
  }

  confirmDelete(seg: Segment): void {
    this.modalService.openConfirm({ title: 'Delete Segment', message: `Delete "${seg.name}"? This cannot be undone.` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.dashService.deleteSegment(Number(seg.id)).subscribe({
          next: () => { this.toastService.success('Segment deleted'); this.load(); },
          error: () => this.toastService.error('Failed to delete segment'),
        });
      });
  }

  segmentStats(seg: Segment): ListStat[] {
    return [
      { value: seg.userCount.toLocaleString(), label: 'Clients' },
      { value: seg.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), label: 'Created' },
      { value: seg.criteriaReadable, label: 'Summary' }
    ];
  }
}
