import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RatingDto } from './services/rating.service';

@Component({
  selector: 'app-rating-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './rating-feed.component.html',
  styleUrl: './rating-feed.component.scss'
})
export class RatingFeedComponent {
  @Input() ratings: RatingDto[] = [];
  @Input() loading = false;
  @Output() deleteRequest = new EventEmitter<RatingDto>();

  readonly sortBy = signal<'newest' | 'highest' | 'lowest'>('newest');

  readonly sortedRatings = computed(() => {
    const s = this.sortBy();
    const list = [...this.ratings];
    if (s === 'newest') {
      return list.sort((a, b) => ((b.createdAt ?? '') > (a.createdAt ?? '') ? 1 : -1));
    }
    if (s === 'highest') {
      return list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return list.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  });

  readonly skeletonRows = [1, 2, 3];

  stars(score: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  avatarColor(userId?: number): string {
    const colors = [
      'rgba(99,102,241,0.7)',
      'rgba(34,197,94,0.7)',
      'rgba(245,158,11,0.7)',
      'rgba(168,85,247,0.7)',
      'rgba(239,68,68,0.7)'
    ];
    return colors[(userId ?? 0) % colors.length];
  }

  avatarInitials(userId?: number): string {
    return 'U' + (userId ?? '?');
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'newest' | 'highest' | 'lowest';
    this.sortBy.set(value);
  }
}
