import {
  Component, EventEmitter, Input, OnChanges, Output,
  SimpleChanges, signal, computed, WritableSignal,
  ChangeDetectionStrategy
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DialogFieldConfig, GenericFormDialogComponent } from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CategoryDto, CategoryService } from './services/category.service';
import { ItemDto, ItemService } from './services/item.service';
import { getCategoryColor, getInitials } from '../../shared/constants/category-colors.constant';

@Component({
  selector: 'app-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, EmptyStateComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnChanges {
  @Input({ required: true }) outletId = 0;
  @Output() openItems = new EventEmitter<CategoryDto>();

  readonly loading  = signal(false);
  readonly categories = signal<CategoryDto[]>([]);
  readonly activeCatId = signal<number | null>(null);
  readonly catSearch   = signal('');

  private readonly itemsCache    = new Map<number, WritableSignal<ItemDto[]>>();
  private readonly loadingItems  = new Map<number, WritableSignal<boolean>>();

  readonly totalItems = computed(() =>
    this.categories().reduce((sum, c) => sum + (c.itemIds?.length ?? 0), 0)
  );

  readonly catFields: DialogFieldConfig[] = [
    { key: 'name',        label: 'Name',        type: 'text',     required: true },
    { key: 'description', label: 'Description', type: 'textarea' }
  ];

  readonly itemFields: DialogFieldConfig[] = [
    { key: 'name',        label: 'Name',        type: 'text',     required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'price',       label: 'Price',       type: 'text' },
    { key: 'type',        label: 'Type',        type: 'text' }
  ];

  readonly shimmerRows = [1, 2, 3];

  constructor(
    private readonly categoryService: CategoryService,
    private readonly itemService: ItemService,
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
        next: cats => {
          this.categories.set(cats);
          if (cats.length > 0) {
            this.activeCatId.set(cats[0].categoryId ?? null);
            cats.forEach(c => { if (c.categoryId) this.loadItems(c.categoryId); });
          }
        },
        error: () => this.snackBar.open('Unable to load categories', 'Close', { duration: 3000 })
      });
  }

  loadItems(catId: number): void {
    if (this.itemsCache.has(catId)) return;
    const itemSig = signal<ItemDto[]>([]);
    const loadSig = signal(true);
    this.itemsCache.set(catId, itemSig);
    this.loadingItems.set(catId, loadSig);
    this.itemService.list(undefined, catId)
      .pipe(finalize(() => loadSig.set(false)))
      .subscribe({ next: items => itemSig.set(items) });
  }

  getItems(catId: number): ItemDto[] {
    const q = this.catSearch().toLowerCase();
    const items = this.itemsCache.get(catId)?.() ?? [];
    if (!q) return items;
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.description?.toLowerCase().includes(q) ?? false)
    );
  }

  isLoadingItems(catId: number): boolean {
    return this.loadingItems.get(catId)?.() ?? false;
  }

  scrollToCategory(catId: number): void {
    this.activeCatId.set(catId);
    const el        = document.getElementById('cat-' + catId);
    const container = document.getElementById('menuContent');
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 48, behavior: 'smooth' });
    }
  }

  onMenuScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const cats      = this.categories();
    let active      = cats[0]?.categoryId ?? null;
    cats.forEach(c => {
      const el = document.getElementById('cat-' + c.categoryId);
      if (el && el.offsetTop - container.scrollTop - 60 <= 0) {
        active = c.categoryId ?? null;
      }
    });
    this.activeCatId.set(active);
  }

  getCatBg(name?: string):   string { return getCategoryColor(name).bg; }
  getCatText(name?: string): string { return getCategoryColor(name).text; }
  getCatBar(name?: string):  string { return getCategoryColor(name).bar; }
  getInitials(name: string): string { return getInitials(name); }

  // ── Category CRUD ────────────────────────────────────────────────────

  openCreateDialog(): void {
    this.dialog.open(GenericFormDialogComponent<CategoryDto>, {
      data: { title: 'Add Category', fields: this.catFields }
    }).afterClosed().subscribe((value: Partial<CategoryDto> | undefined) => {
      if (!value) return;
      this.categoryService.create({ ...value, outletId: this.outletId } as CategoryDto).subscribe({
        next: () => { this.snackBar.open('Category created', 'Close', { duration: 2500 }); this.loadCategories(); },
        error: () => this.snackBar.open('Failed to create category', 'Close', { duration: 3000 })
      });
    });
  }

  openEditDialog(cat: CategoryDto, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open(GenericFormDialogComponent<CategoryDto>, {
      data: { title: `Edit ${cat.name}`, fields: this.catFields, initialValue: cat }
    }).afterClosed().subscribe((value: Partial<CategoryDto> | undefined) => {
      if (!value || !cat.categoryId) return;
      this.categoryService.update(cat.categoryId, { ...cat, ...value }).subscribe({
        next: () => { this.snackBar.open('Category updated', 'Close', { duration: 2500 }); this.loadCategories(); },
        error: () => this.snackBar.open('Failed to update category', 'Close', { duration: 3000 })
      });
    });
  }

  confirmDelete(cat: CategoryDto, event?: Event): void {
    event?.stopPropagation();
    if (!cat.categoryId) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Category', message: `Delete "${cat.name}"?` }
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.categoryService.delete(cat.categoryId!).subscribe({
        next: () => { this.snackBar.open('Category deleted', 'Close', { duration: 2500 }); this.loadCategories(); },
        error: () => this.snackBar.open('Failed to delete category', 'Close', { duration: 3000 })
      });
    });
  }

  // ── Item CRUD ────────────────────────────────────────────────────────

  openAddItem(catId: number, event: Event): void {
    event.stopPropagation();
    this.dialog.open(GenericFormDialogComponent<ItemDto>, {
      data: { title: 'Add Item', fields: this.itemFields }
    }).afterClosed().subscribe((value: Partial<ItemDto> | undefined) => {
      if (!value) return;
      this.itemService.create({ ...value, categoryId: catId, outletId: this.outletId } as ItemDto).subscribe({
        next: () => {
          this.snackBar.open('Item created', 'Close', { duration: 2500 });
          this.itemsCache.delete(catId);
          this.loadItems(catId);
        },
        error: () => this.snackBar.open('Failed to create item', 'Close', { duration: 3000 })
      });
    });
  }

  openEditItem(item: ItemDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(GenericFormDialogComponent<ItemDto>, {
      data: { title: `Edit ${item.name}`, fields: this.itemFields, initialValue: item }
    }).afterClosed().subscribe((value: Partial<ItemDto> | undefined) => {
      if (!value || !item.itemId) return;
      this.itemService.update(item.itemId, { ...item, ...value }).subscribe({
        next: () => {
          this.snackBar.open('Item updated', 'Close', { duration: 2500 });
          const catId = item.categoryId;
          if (catId) { this.itemsCache.delete(catId); this.loadItems(catId); }
        },
        error: () => this.snackBar.open('Failed to update item', 'Close', { duration: 3000 })
      });
    });
  }

  confirmDeleteItem(item: ItemDto, catId: number, event: Event): void {
    event.stopPropagation();
    if (!item.itemId) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Item', message: `Delete "${item.name}"?` }
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.itemService.delete(item.itemId!).subscribe({
        next: () => {
          this.snackBar.open('Item deleted', 'Close', { duration: 2500 });
          this.itemsCache.delete(catId);
          this.loadItems(catId);
        },
        error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
      });
    });
  }

  toggleAvailability(item: ItemDto, event: Event): void {
    event.stopPropagation();
    if (!item.itemId || !item.categoryId) return;
    const updated = { ...item, available: !item.available };
    this.itemService.update(item.itemId, updated).subscribe({
      next: () => {
        const sig = this.itemsCache.get(item.categoryId!);
        if (sig) sig.update(list => list.map(i => i.itemId === item.itemId ? updated : i));
      }
    });
  }
}
