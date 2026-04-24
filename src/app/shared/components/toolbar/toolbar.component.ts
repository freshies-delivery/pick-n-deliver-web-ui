import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ToolbarConfig {
  showSearch?: boolean;
  showFilter?: boolean;
  showSort?: boolean;
  showViewToggle?: boolean;
  showDarkModeToggle?: boolean;
  filterOptions?: Array<{ label: string; value: string }>;
  sortOptions?: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  @Input() config: ToolbarConfig = { showSearch: true };
  @Input() searchPlaceholder = 'Search...';
  @Input() searchValue = '';
  @Input() filterValue = '';
  @Input() sortValue = '';
  @Input() viewMode: 'table' | 'grid' = 'table';
  @Input() darkMode = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'table' | 'grid'>();
  @Output() darkModeChange = new EventEmitter<boolean>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onFilterChange(value: string): void {
    this.filterChange.emit(value);
  }

  onSortChange(value: string): void {
    this.sortChange.emit(value);
  }

  onViewModeChange(value: 'table' | 'grid'): void {
    this.viewModeChange.emit(value);
  }

  onDarkModeChange(value: boolean): void {
    this.darkModeChange.emit(value);
  }
}

