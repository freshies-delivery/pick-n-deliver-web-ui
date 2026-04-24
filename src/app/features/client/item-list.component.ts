import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PageHeaderAction, PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ItemDto, ItemService } from './services/item.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [MatIconModule, PageHeaderComponent, DataTableComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class ItemListComponent implements OnInit, OnDestroy {
  readonly clientId = signal(0);
  readonly outletId = signal(0);
  readonly categoryId = signal(0);

  readonly loading = signal(false);
  readonly items = signal<ItemDto[]>([]);
  readonly searchQuery = signal('');
  readonly availabilityFilter = signal('');
  readonly sortBy = signal('');
  readonly viewMode = signal<'table' | 'grid'>('table');
  readonly darkMode = signal(false);

  readonly visibleItems = computed(() => {
    const filter = this.availabilityFilter();
    const sort = this.sortBy();

    let list = [...this.items()];

    if (filter === 'available') {
      list = list.filter((item) => item.available === true);
    } else if (filter === 'unavailable') {
      list = list.filter((item) => item.available === false);
    }

    if (sort === 'price_asc') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    }

    return list;
  });

  readonly columns: ColumnConfig[] = [
    { key: 'itemId', label: 'ID', type: 'text', width: '80px' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'price', label: 'Price', type: 'currency', width: '120px' },
    { key: 'available', label: 'Status', type: 'boolean', width: '140px' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Item Name', type: 'text', required: true, placeholder: 'Enter item name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter item description', rows: 3 },
    { key: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
    { key: 'price', label: 'Price (₹)', type: 'number', required: true, placeholder: 'Enter price' },
    { key: 'available', label: 'Available', type: 'toggle' },
    { key: 'type', label: 'Type', type: 'text', placeholder: 'e.g., Veg, Non-veg' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add Item',
      icon: 'add',
      type: 'primary',
      action: () => this.openCreateDialog()
    }
  ];


  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemService: ItemService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.outletId.set(Number(this.route.snapshot.paramMap.get('outletId')));
    this.categoryId.set(Number(this.route.snapshot.paramMap.get('categoryId')));
    this.hierarchyState.syncFromRoute(this.route.snapshot);
    this.fabActionService.registerAction('createItem', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createItem');
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
        width: '600px',
        maxWidth: '90vw',
        data: {
          title: 'Add New Item',
          subtitle: 'Create a new item in this category',
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
          categoryId: this.categoryId(),
          outletId: this.outletId()
        } as ItemDto;

        this.itemService.create(payload).subscribe({
          next: () => {
            this.snackBar.open('Item created successfully', 'Close', { duration: 2500 });
            this.loadItems();
          },
          error: () => this.snackBar.open('Failed to create item', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(item: ItemDto): void {
    this.dialog
      .open(GenericFormDialogComponent<ItemDto>, {
        width: '600px',
        maxWidth: '90vw',
        data: {
          title: 'Edit Item',
          subtitle: `Updating ${item.name}`,
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
          categoryId: this.categoryId(),
          outletId: this.outletId()
        };

        this.itemService.update(item.itemId, payload).subscribe({
          next: () => {
            this.snackBar.open('Item updated successfully', 'Close', { duration: 2500 });
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
        width: '400px',
        data: {
          title: 'Delete Item',
          message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.itemService.delete(item.itemId!).subscribe({
          next: () => {
            this.snackBar.open('Item deleted successfully', 'Close', { duration: 2500 });
            this.loadItems();
          },
          error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
        });
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onFilterChange(value: string): void {
    this.availabilityFilter.set(value);
  }

  onSortChange(value: string): void {
    this.sortBy.set(value);
  }

  onViewModeChange(value: 'table' | 'grid'): void {
    this.viewMode.set(value);
  }

  onDarkModeChange(enabled: boolean): void {
    this.darkMode.set(enabled);
    document.body.classList.toggle('dark-theme', enabled);
  }
}

