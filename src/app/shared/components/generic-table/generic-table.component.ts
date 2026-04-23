import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.css'
})
export class GenericTableComponent<T = unknown> {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() loading = false;
  @Input() clickableRows = true;
  @Input() emptyMessage = 'No records found';

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() rowClick = new EventEmitter<T>();

  searchText = '';

  get displayedColumns(): string[] {
    return [...this.columns.map((column) => column.key), 'actions'];
  }

  get filteredData(): T[] {
    const query = this.searchText.trim().toLowerCase();
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

  getCellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
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



