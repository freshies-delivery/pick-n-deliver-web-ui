import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { RatingDto } from './services/rating.service';

@Component({
  selector: 'app-rating-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-sidebar.component.html',
  styleUrl: './rating-sidebar.component.scss'
})
export class RatingSidebarComponent {
  @Input() ratings: RatingDto[] = [];
  @Input() activeFilter: number | 'all' = 'all';
  @Output() filterChange = new EventEmitter<number | 'all'>();

  readonly starLevels = [5, 4, 3, 2, 1];

  get avgScore(): string {
    if (!this.ratings.length) return '0.0';
    const sum = this.ratings.reduce((acc, r) => acc + (r.score ?? 0), 0);
    return (sum / this.ratings.length).toFixed(1);
  }

  get totalCount(): number {
    return this.ratings.length;
  }

  get roundedAvg(): number {
    return Math.round(+this.avgScore);
  }

  countFor(star: number): number {
    return this.ratings.filter(r => r.score === star).length;
  }

  percentFor(star: number): number {
    if (!this.ratings.length) return 0;
    return Math.round((this.countFor(star) / this.ratings.length) * 100);
  }

  starRange(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
