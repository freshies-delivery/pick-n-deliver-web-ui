import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface PageHeaderAction {
  label: string;
  icon?: string;
  type?: 'primary' | 'secondary';
  action: () => void;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() breadcrumb = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() actions: PageHeaderAction[] = [];
}

