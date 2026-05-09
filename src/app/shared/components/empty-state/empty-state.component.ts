import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = 'No items found.';
  @Input() ctaLabel?: string;
  @Output() ctaClick = new EventEmitter<void>();
}
