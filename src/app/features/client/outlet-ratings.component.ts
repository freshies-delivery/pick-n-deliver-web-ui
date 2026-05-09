import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { RatingSidebarComponent } from './rating-sidebar.component';
import { RatingFeedComponent } from './rating-feed.component';
import { RatingDto, RatingService } from './services/rating.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

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

  readonly loading = signal(false);
  readonly ratings = signal<RatingDto[]>([]);
  readonly activeFilter = signal<number | 'all'>('all');

  readonly filteredRatings = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.ratings();
    return this.ratings().filter(r => r.score === f);
  });

  constructor(
    private readonly ratingService: RatingService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId'] && this.outletId) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.ratingService
      .listForOutlet(this.outletId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => this.ratings.set(r),
        error: () => this.snackBar.open('Unable to load ratings', 'Close', { duration: 3000 })
      });
  }

  requestDelete(rating: RatingDto): void {
    if (!rating.ratingId) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Review',
          message: 'Remove this review permanently?'
        }
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.ratingService.deleteRating(rating.ratingId!).subscribe({
          next: () => {
            this.snackBar.open('Review deleted', 'Close', { duration: 2500 });
            this.load();
          },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
        });
      });
  }
}
