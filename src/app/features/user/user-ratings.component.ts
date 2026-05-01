import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { UserContextService } from '../../core/services/user-context.service';
import { RatingDto, UserRatingService } from './services/user-rating.service';

@Component({
  selector: 'app-user-ratings',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  templateUrl: './user-ratings.component.html',
  styleUrl: './user-ratings.component.scss'
})
export class UserRatingsComponent implements OnInit {
  readonly userId = signal(0);
  readonly loading = signal(false);
  readonly ratings = signal<RatingDto[]>([]);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly columns: ColumnConfig[] = [
    { key: 'ratingId', label: 'ID' },
    { key: 'score', label: 'Rating' },
    { key: 'comment', label: 'Comment' },
    { key: 'createdAt', label: 'Date' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly userRatingService: UserRatingService,
    private readonly snackBar: MatSnackBar
  ) {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }

  ngOnInit(): void {
    this.loadRatings();
  }

  loadRatings(): void {
    this.loading.set(true);
    this.userRatingService
      .listForUser(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (ratings) => this.ratings.set(ratings),
        error: () => this.snackBar.open('Unable to load ratings', 'Close', { duration: 3000 })
      });
  }
}
