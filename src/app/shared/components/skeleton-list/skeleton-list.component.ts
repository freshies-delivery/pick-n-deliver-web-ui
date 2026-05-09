import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-list.component.html',
  styleUrl: './skeleton-list.component.scss'
})
export class SkeletonListComponent {
  @Input() rows = 5;
  get rowArray(): number[] { return Array.from({ length: this.rows }, (_, i) => i); }
}
