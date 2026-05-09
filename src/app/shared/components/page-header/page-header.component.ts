import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface PageHeaderAction {
  label: string;
  icon?: string;
  type?: 'primary' | 'secondary';
  variant?: 'primary' | 'outline' | 'ghost';
  action: () => void;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() breadcrumb = '';
  @Input() sectionLabel?: string;
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() actions: PageHeaderAction[] = [];

  getVariant(action: PageHeaderAction): string {
    if (action.variant) return action.variant;
    return action.type === 'secondary' ? 'outline' : 'primary';
  }
}
