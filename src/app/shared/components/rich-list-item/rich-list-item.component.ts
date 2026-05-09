import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CategoryColor, getCategoryColor, getInitials } from '../../../shared/constants/category-colors.constant';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface ListStat {
  value: string | number;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-rich-list-item',
  standalone: true,
  imports: [StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rich-list-item.component.html',
  styleUrl: './rich-list-item.component.scss'
})
export class RichListItemComponent {
  @Input() id!: string | number;
  @Input() name!: string;
  @Input() description?: string;
  @Input() location?: string;
  @Input() category?: string;
  @Input() status?: string;
  @Input() avatarInitials?: string;
  @Input() stats?: ListStat[];
  @Input() badges?: string[];
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() showView = false;
  @Input() accentBar = true;

  @Output() editClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() viewClick = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<void>();

  get categoryColor(): CategoryColor { return getCategoryColor(this.category); }
  get initials(): string { return this.avatarInitials ?? getInitials(this.name); }

  stopProp(e: Event): void { e.stopPropagation(); }
}
