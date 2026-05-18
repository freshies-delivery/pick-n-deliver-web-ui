import {
  Component, OnInit, computed, signal,
  ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RatingSidebarComponent } from '../client/rating-sidebar.component';
import { RatingFeedComponent } from '../client/rating-feed.component';
import { UserContextService } from '../../core/services/user-context.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { UserRatingService, RatingDto } from './services/user-rating.service';

@Component({
  selector: 'app-user-ratings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, RatingSidebarComponent, RatingFeedComponent, RouterLink, RouterLinkActive],
  templateUrl: './user-ratings.component.html',
  styleUrl: './user-ratings.component.scss',
})
export class UserRatingsComponent implements OnInit {
  readonly userId      = signal(0);
  readonly loading     = signal(false);
  readonly ratings     = signal<RatingDto[]>([]);
  readonly activeFilter= signal<number | 'all'>('all');
  readonly userLabel   = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly filteredRatings = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.ratings();
    return this.ratings().filter(r => r.score === f);
  });

  private readonly userContext    = inject(UserContextService);
  private readonly modalService   = inject(ModalService);
  private readonly toastService   = inject(ToastService);
  private readonly ratingService  = inject(UserRatingService);
  private readonly route          = inject(ActivatedRoute);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.ratingService.listByUser(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: list => this.ratings.set(list),
        error: () => this.toastService.error('Unable to load ratings'),
      });
  }

  requestDelete(rating: RatingDto): void {
    if (!rating.ratingId) return;
    this.modalService.openConfirm({ title: 'Delete Rating', message: 'Remove this rating permanently?' })
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.ratingService.delete(rating.ratingId!).subscribe({
          next: () => {
            this.toastService.success('Rating deleted');
            this.ratings.update(list => list.filter(r => r.ratingId !== rating.ratingId));
          },
          error: () => this.toastService.error('Failed to delete'),
        });
      });
  }
}
