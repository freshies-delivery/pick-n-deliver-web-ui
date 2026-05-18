import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { AppDashService } from '../../core/services/app-dash.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { AppDashRatingDto, AppDashRatingSummaryDto } from '../../core/models/app-dash.models';

@Component({
  selector: 'app-client-ratings-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, SkeletonListComponent, EmptyStateComponent,
    PaginationComponent, RouterLink, RouterLinkActive, DatePipe, DecimalPipe,
  ],
  templateUrl: './client-ratings-tab.component.html',
  styleUrl: './client-ratings-tab.component.scss',
})
export class ClientRatingsTabComponent implements OnInit {
  readonly clientId    = signal(0);
  readonly loading     = signal(true);
  readonly ratings     = signal<AppDashRatingDto[]>([]);
  readonly summary     = signal<AppDashRatingSummaryDto | null>(null);
  readonly total       = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize    = 20;
  readonly clientName  = signal('');

  readonly stars = [5, 4, 3, 2, 1];

  private readonly dashService = inject(AppDashService);
  private readonly hierService = inject(HierarchyStateService);
  private readonly route       = inject(ActivatedRoute);
  private readonly destroyRef  = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('clientId'));
    this.clientId.set(id);
    this.clientName.set(this.hierService.state.clientName ?? 'Client');
  }

  ngOnInit(): void {
    forkJoin({
      summary: this.dashService.getClientRatingSummary(this.clientId()),
      ratings: this.dashService.getClientRatings(this.clientId(), 0, this.pageSize),
    })
    .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ summary, ratings }) => {
        this.summary.set(summary);
        this.ratings.set(ratings.content ?? []);
        this.total.set(ratings.total ?? ratings.totalElements ?? 0);
      },
    });
  }

  loadRatings(page: number): void {
    this.loading.set(true);
    this.dashService.getClientRatings(this.clientId(), page, this.pageSize)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.ratings.set(res.content ?? []);
          this.total.set(res.total ?? res.totalElements ?? 0);
          this.currentPage.set(page);
        },
      });
  }

  onPageChange(page: number): void { this.loadRatings(page - 1); }

  starCount(star: number): number {
    const s = this.summary();
    if (!s) return 0;
    const map: Record<number, number> = {
      5: s.fiveStarCount  ?? 0,
      4: s.fourStarCount  ?? 0,
      3: s.threeStarCount ?? 0,
      2: s.twoStarCount   ?? 0,
      1: s.oneStarCount   ?? 0,
    };
    return map[star] ?? 0;
  }

  starBarWidth(star: number): number {
    const total = this.summary()?.totalRatings ?? 0;
    return total ? Math.round((this.starCount(star) / total) * 100) : 0;
  }

  starFilled(s: number, avg: number): boolean {
    return s <= Math.round(avg);
  }

  protected readonly Math = Math;
}
