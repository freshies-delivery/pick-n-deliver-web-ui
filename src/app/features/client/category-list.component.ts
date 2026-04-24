import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { CategoryDto, CategoryService } from './services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnChanges {
  @Input({ required: true }) outletId = 0;
  @Output() openItems = new EventEmitter<CategoryDto>();

  readonly loading = signal(false);
  readonly categories = signal<CategoryDto[]>([]);

  readonly columns: ColumnConfig[] = [
    { key: 'categoryId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' }
  ];

  constructor(
    private readonly categoryService: CategoryService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId']?.currentValue) {
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .list(this.outletId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.snackBar.open('Unable to load categories', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<CategoryDto>, {
        data: {
          title: 'Add Category',
          fields: this.fields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<CategoryDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: CategoryDto = {
          ...value,
          outletId: this.outletId // map2
        } as CategoryDto;

        this.categoryService.create(payload).subscribe({
          next: () => {
            this.snackBar.open('Category created', 'Close', { duration: 2500 });
            this.loadCategories();
          },
          error: () => this.snackBar.open('Failed to create category', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(category: CategoryDto): void {
    this.dialog
      .open(GenericFormDialogComponent<CategoryDto>, {
        data: {
          title: `Edit ${category.name}`,
          fields: this.fields,
          initialValue: category
        }
      })
      .afterClosed()
      .subscribe((value: Partial<CategoryDto> | undefined) => {
        if (!value || !category.categoryId) {
          return;
        }

        const payload: CategoryDto = {
          ...category,
          ...value,
          outletId: this.outletId // map2
        };

        this.categoryService.update(category.categoryId, payload).subscribe({
          next: () => {
            this.snackBar.open('Category updated', 'Close', { duration: 2500 });
            this.loadCategories();
          },
          error: () => this.snackBar.open('Failed to update category', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(category: CategoryDto): void {
    if (!category.categoryId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Category',
          message: `Are you sure you want to delete ${category.name}?`
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.categoryService.delete(category.categoryId!).subscribe({
          next: () => {
            this.snackBar.open('Category deleted', 'Close', { duration: 2500 });
            this.loadCategories();
          },
          error: () => this.snackBar.open('Failed to delete category', 'Close', { duration: 3000 })
        });
      });
  }
}

