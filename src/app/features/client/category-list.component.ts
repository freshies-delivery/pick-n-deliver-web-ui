import {
  Component, EventEmitter, Input, OnChanges, Output,
  SimpleChanges, signal, computed, WritableSignal,
  ChangeDetectionStrategy, inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CategoryDto, CategoryService } from './services/category.service';
import { ItemDto, ItemService } from './services/item.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
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

  readonly shimmerRows = [1, 2, 3];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly itemService: ItemService,
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
        error: () => this.toastService.error('Unable to load categories')
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
    const outletId = this.outletId;
    this.modalService.openAddCategory(outletId, '').subscribe(value => {
      if (!value) return;
      this.categoryService.create({ ...value, outletId } as CategoryDto).subscribe({
        next: () => { this.toastService.success('Category created'); this.loadCategories(); },
        error: () => this.toastService.error('Failed to create category')
      });
    });
  }

  openEditDialog(cat: CategoryDto, event?: Event): void {
    event?.stopPropagation();
    this.modalService.openEditCategory(cat).subscribe(value => {
      if (!value || !cat.categoryId) return;
      this.categoryService.update(cat.categoryId, { ...cat, ...value }).subscribe({
        next: () => { this.toastService.success('Category updated'); this.loadCategories(); },
        error: () => this.toastService.error('Failed to update category')
      });
    });
  }

  confirmDelete(cat: CategoryDto, event?: Event): void {
    event?.stopPropagation();
    if (!cat.categoryId) return;
    this.modalService.openConfirm({ title: 'Delete Category', message: `Delete "${cat.name}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.categoryService.delete(cat.categoryId!).subscribe({
          next: () => { this.toastService.success('Category deleted'); this.loadCategories(); },
          error: () => this.toastService.error('Failed to delete category')
        });
      });
  }

  // ── Item CRUD ────────────────────────────────────────────────────────

  openAddItem(catId: number, event: Event): void {
    event.stopPropagation();
    const cat = this.categories().find(c => c.categoryId === catId);
    this.modalService.openAddItem(this.outletId, catId, cat?.name ?? '').subscribe(value => {
      if (!value) return;
      this.itemService.create({ ...value, categoryId: catId, outletId: this.outletId } as ItemDto).subscribe({
        next: () => {
          this.toastService.success('Item created');
          this.itemsCache.delete(catId);
          this.loadItems(catId);
        },
        error: () => this.toastService.error('Failed to create item')
      });
    });
  }

  openEditItem(item: ItemDto, event: Event): void {
    event.stopPropagation();
    const cat = this.categories().find(c => c.categoryId === item.categoryId);
    this.modalService.openEditItem(item, cat?.name ?? '').subscribe(value => {
      if (!value || !item.itemId) return;
      this.itemService.update(item.itemId, { ...item, ...value }).subscribe({
        next: () => {
          this.toastService.success('Item updated');
          const catId = item.categoryId;
          if (catId) { this.itemsCache.delete(catId); this.loadItems(catId); }
        },
        error: () => this.toastService.error('Failed to update item')
      });
    });
  }

  confirmDeleteItem(item: ItemDto, catId: number, event: Event): void {
    event.stopPropagation();
    if (!item.itemId) return;
    this.modalService.openConfirm({ title: 'Delete Item', message: `Delete "${item.name}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.itemService.delete(item.itemId!).subscribe({
          next: () => {
            this.toastService.success('Item deleted');
            this.itemsCache.delete(catId);
            this.loadItems(catId);
          },
          error: () => this.toastService.error('Failed to delete item')
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
