import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpinnerComponent } from '../spinner/spinner.component';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'currency' | 'custom';
  width?: string;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    SpinnerComponent,
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
  animations: [
    trigger('rowsStagger', [
      transition('* => *', [
        query(
          '.data-row',
          [
            style({ opacity: 0, transform: 'translateY(4px)' }),
            stagger(28, [animate('140ms ease-out', style({ opacity: 1, transform: 'none' }))])
          ],
          { optional: true }
        )
      ])
    ])
  ]
})
export class GenericTableComponent<T = unknown> {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() loading = false;
  @Input() clickableRows = true;
  @Input() emptyMessage = 'No records found';
  @Input() searchTerm = '';
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [5, 10, 25, 50];
  @Input() showPaginator = true;

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() rowClick = new EventEmitter<T>();

  currentPage = 0;
  currentPageSize = this.pageSize;

  get displayedColumns(): string[] {
    return [...this.columns.map((column) => column.key), 'actions'];
  }

  get filteredData(): T[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.data;
    }

    return this.data.filter((row) =>
      this.columns.some((column) =>
        String(this.getCellValue(row, column.key) ?? '')
          .toLowerCase()
          .includes(query)
      )
    );
  }

  get paginatedData(): T[] {
    const startIndex = this.currentPage * this.currentPageSize;
    const endIndex = startIndex + this.currentPageSize;
    return this.filteredData.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
  }


  getCellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  getColumnClass(key: string): string {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey === 'id' || normalizedKey.endsWith('id')) {
      return 'col-id';
    }

    if (normalizedKey === 'name') {
      return 'col-name';
    }

    if (normalizedKey === 'description' || normalizedKey === 'comment' || normalizedKey === 'comments') {
      return 'col-description';
    }

    return '';
  }

  getFormattedValue(row: T, column: TableColumn): string | boolean {
    const value = this.getCellValue(row, column.key);

    if (column.type === 'boolean') {
      return value === true || value === 'true';
    }

    if (column.type === 'currency') {
      return typeof value === 'number' ? `₹${value.toFixed(2)}` : String(value ?? '');
    }

    return String(value ?? '');
  }

  isTrueValue(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  }

  onRowClick(row: T): void {
    if (!this.clickableRows) {
      return;
    }
    this.rowClick.emit(row);
  }

  onEdit(event: MouseEvent, row: T): void {
    event.stopPropagation();
    this.edit.emit(row);
  }

  onDelete(event: MouseEvent, row: T): void {
    event.stopPropagation();
    this.delete.emit(row);
  }
}
