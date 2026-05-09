import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-page-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-toolbar.component.html',
  styleUrl: './page-toolbar.component.scss'
})
export class PageToolbarComponent {
  @Input() searchPlaceholder = 'Search...';
  @Input() filterOptions: FilterOption[] = [];
  @Input() activeFilter = 'all';
  @Input() showViewToggle = false;
  @Input() currentView: 'list' | 'grid' = 'list';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() viewChange = new EventEmitter<'list' | 'grid'>();

  onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
