import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, inject, signal, computed
} from '@angular/core';
import { finalize } from 'rxjs';
import { RatingSidebarComponent } from './rating-sidebar.component';
import { RatingFeedComponent } from './rating-feed.component';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';

@Component({
  selector: 'app-outlet-ratings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RatingSidebarComponent, RatingFeedComponent],
  templateUrl: './outlet-ratings.component.html',
  styleUrl: './outlet-ratings.component.scss'
})
export class OutletRatingsComponent implements OnChanges {
  @Input() outletId = 0;

  readonly loading      = signal(false);
  readonly ratings      = signal<any[]>([]);
  readonly summary      = signal<any>(null);
  readonly activeFilter = signal<number | 'all'>('all');

  readonly filteredRatings = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.ratings();
    return this.ratings().filter(r => r.score === f);
  });

  private readonly dashService  = inject(AppDashService);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId'] && this.outletId) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.dashService.getRatings(this.outletId, 0, 100)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          const list = Array.isArray(res) ? res : (res?.content ?? []);
          this.ratings.set(list);
        },
        error: () => this.toastService.error('Unable to load ratings')
      });
    this.dashService.getRatingSummary(this.outletId)
      .subscribe({ next: s => this.summary.set(s) });
  }

  requestDelete(rating: any): void {
    if (!rating.ratingId) return;
    this.modalService.openConfirm({ title: 'Delete Review', message: 'Remove this review permanently?' })
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.dashService.deleteRating(this.outletId, rating.ratingId).subscribe({
          next: () => {
            this.toastService.success('Review deleted');
            this.ratings.update(list => list.filter(r => r.ratingId !== rating.ratingId));
            this.dashService.getRatingSummary(this.outletId)
              .subscribe({ next: s => this.summary.set(s) });
          },
          error: () => this.toastService.error('Failed to delete')
        });
      });
  }
}
