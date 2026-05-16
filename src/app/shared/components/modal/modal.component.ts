import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() hasIcon = false;
  @Output() closeRequested = new EventEmitter<void>();
}
