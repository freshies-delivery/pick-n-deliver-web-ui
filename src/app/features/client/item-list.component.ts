import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { GenericTableComponent, TableColumn } from '../../shared/components/generic-table/generic-table.component';
import { ItemDto, ItemService } from './services/item.service';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, BreadcrumbsComponent, GenericTableComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css'
})
export class ItemListComponent implements OnInit {
  readonly clientId = signal(0);
  readonly outletId = signal(0);
  readonly categoryId = signal(0);

  readonly loading = signal(false);
  readonly items = signal<ItemDto[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'itemId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'available', label: 'Available' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'imageUrl', label: 'Image URL', type: 'text' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'available', label: 'Available', type: 'checkbox' },
    { key: 'type', label: 'Type', type: 'text' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemService: ItemService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.outletId.set(Number(this.route.snapshot.paramMap.get('outletId')));
    this.categoryId.set(Number(this.route.snapshot.paramMap.get('categoryId')));
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.itemService
      .list(this.outletId(), this.categoryId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: () => this.snackBar.open('Unable to load items', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<ItemDto>, {
        data: {
          title: 'Add Item',
          fields: this.fields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<ItemDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: ItemDto = {
          ...value,
          categoryId: this.categoryId(), // map3
          outletId: this.outletId() // map3
        } as ItemDto;

        this.itemService.create(payload).subscribe({
          next: () => {
            this.snackBar.open('Item created', 'Close', { duration: 2500 });
            this.loadItems();
          },
          error: () => this.snackBar.open('Failed to create item', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(item: ItemDto): void {
    this.dialog
      .open(GenericFormDialogComponent<ItemDto>, {
        data: {
          title: `Edit ${item.name}`,
          fields: this.fields,
          initialValue: item
        }
      })
      .afterClosed()
      .subscribe((value: Partial<ItemDto> | undefined) => {
        if (!value || !item.itemId) {
          return;
        }

        const payload: ItemDto = {
          ...item,
          ...value,
          categoryId: this.categoryId(), // map3
          outletId: this.outletId() // map3
        };

        this.itemService.update(item.itemId, payload).subscribe({
          next: () => {
            this.snackBar.open('Item updated', 'Close', { duration: 2500 });
            this.loadItems();
          },
          error: () => this.snackBar.open('Failed to update item', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(item: ItemDto): void {
    if (!item.itemId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Item',
          message: `Are you sure you want to delete ${item.name}?`
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.itemService.delete(item.itemId!).subscribe({
          next: () => {
            this.snackBar.open('Item deleted', 'Close', { duration: 2500 });
            this.loadItems();
          },
          error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
        });
      });
  }
}

