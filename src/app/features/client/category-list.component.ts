import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, Output,
  SimpleChanges, signal, computed, WritableSignal,
  ChangeDetectionStrategy, inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';
import { getCategoryColor, getInitials } from '../../shared/constants/category-colors.constant';

@Component({
  selector: 'app-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, EmptyStateComponent, SpinnerComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) outletId = 0;
  @Output() openItems = new EventEmitter<any>();

  readonly loading    = signal(false);
  readonly categories = signal<any[]>([]);
  readonly activeCatId  = signal<number | null>(null);
  readonly catSearch    = signal('');

  private readonly itemsCache    = new Map<number, WritableSignal<any[]>>();
  private readonly loadingItems  = new Map<number, WritableSignal<boolean>>();
  private isProgrammaticScroll   = false;
  private scrollResetTimer: ReturnType<typeof setTimeout> | null = null;

  readonly totalItems = computed(() =>
    this.categories().reduce((sum, c) => {
      if (!c.categoryId) return sum;
      return sum + (this.itemsCache.get(c.categoryId)?.()?.length ?? 0);
    }, 0)
  );

  readonly shimmerRows = [1, 2, 3];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  private readonly dashService  = inject(AppDashService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId']?.currentValue) {
      this.loadCategories();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollResetTimer) clearTimeout(this.scrollResetTimer);
  }

  loadCategories(): void {
    this.loading.set(true);
    this.dashService.getCategories(this.outletId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: cats => {
          const list = Array.isArray(cats) ? cats : [];
          this.categories.set(list);
          if (list.length > 0) {
            this.activeCatId.set(list[0].categoryId ?? null);
            list.forEach((c: any) => { if (c.categoryId) this.loadItems(c.categoryId); });
          }
        },
        error: () => this.toastService.error('Unable to load categories')
      });
  }

  loadItems(catId: number): void {
    if (this.itemsCache.has(catId)) return;
    const itemSig = signal<any[]>([]);
    const loadSig = signal(true);
    this.itemsCache.set(catId, itemSig);
    this.loadingItems.set(catId, loadSig);
    this.dashService.getItems(this.outletId, catId)
      .pipe(finalize(() => loadSig.set(false)))
      .subscribe({
        next: items => itemSig.set(Array.isArray(items) ? items : [])
      });
  }

  reloadItems(catId: number): void {
    this.itemsCache.delete(catId);
    this.loadingItems.delete(catId);
    this.loadItems(catId);
  }

  getItems(catId: number): any[] {
    const q     = this.catSearch().toLowerCase();
    const items = this.itemsCache.get(catId)?.() ?? [];
    if (!q) return items;
    return items.filter(i =>
      i.name?.toLowerCase().includes(q) ||
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
    if (!el || !container) return;

    // getBoundingClientRect gives position relative to the viewport, so their
    // difference is the element's position relative to the container's visible top.
    // Adding scrollTop converts that to the absolute scroll target inside the container.
    const scrollTarget =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop - 16;

    // Guard against onMenuScroll resetting activeCatId before smooth scroll settles.
    this.isProgrammaticScroll = true;
    if (this.scrollResetTimer) clearTimeout(this.scrollResetTimer);
    this.scrollResetTimer = setTimeout(() => { this.isProgrammaticScroll = false; }, 700);

    container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }

  onMenuScroll(event: Event): void {
    if (this.isProgrammaticScroll) return;

    const container = event.target as HTMLElement;
    const containerTop = container.getBoundingClientRect().top;
    const cats = this.categories();
    let active = cats[0]?.categoryId ?? null;

    for (const c of cats) {
      const el = document.getElementById('cat-' + c.categoryId);
      // Element has scrolled to within 60px of the container's top edge.
      if (el && el.getBoundingClientRect().top - containerTop <= 60) {
        active = c.categoryId ?? null;
      }
    }
    this.activeCatId.set(active);
  }

  getCatBg(name?: string):   string { return getCategoryColor(name).bg; }
  getCatText(name?: string): string { return getCategoryColor(name).text; }
  getCatBar(name?: string):  string { return getCategoryColor(name).bar; }
  getInitials(name: string): string { return getInitials(name); }

  // ── Category CRUD ────────────────────────────────────────────────────

  openCreateDialog(): void {
    this.modalService.openAddCategory(this.outletId, '').subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:        value.name,
        description: value.description ?? '',
        imageUrl:    value.image_url ?? '',
        segmentId:   value.segment_id ?? null,
      };
      this.dashService.createCategory(this.outletId, dto).subscribe({
        next: () => { this.toastService.success('Category created'); this.loadCategories(); },
        error: () => this.toastService.error('Failed to create category')
      });
    });
  }

  openEditDialog(cat: any, event?: Event): void {
    event?.stopPropagation();
    this.modalService.openEditCategory(cat).subscribe((value: any) => {
      if (!value || !cat.categoryId) return;
      const dto = {
        name:        value.name ?? cat.name,
        description: value.description ?? cat.description ?? '',
        imageUrl:    value.image_url ?? cat.imageUrl ?? '',
        segmentId:   value.segment_id ?? cat.segmentId ?? null,
      };
      this.dashService.updateCategory(this.outletId, cat.categoryId, dto).subscribe({
        next: () => { this.toastService.success('Category updated'); this.loadCategories(); },
        error: () => this.toastService.error('Failed to update category')
      });
    });
  }

  confirmDelete(cat: any, event?: Event): void {
    event?.stopPropagation();
    if (!cat.categoryId) return;
    this.modalService.openConfirm({ title: 'Delete Category', message: `Delete "${cat.name}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.dashService.deleteCategory(this.outletId, cat.categoryId).subscribe({
          next: () => { this.toastService.success('Category deleted'); this.loadCategories(); },
          error: () => this.toastService.error('Failed to delete category')
        });
      });
  }

  // ── Item CRUD ────────────────────────────────────────────────────────

  openAddItem(catId: number, event: Event): void {
    event.stopPropagation();
    const cat = this.categories().find(c => c.categoryId === catId);
    this.modalService.openAddItem(this.outletId, catId, cat?.name ?? '').subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:        value.name,
        description: value.description ?? '',
        price:       value.price ?? 0,
        type:        value.type ?? 'VEG',
        available:   value.available ?? true,
        imageUrl:    value.image_url ?? '',
        categoryId:  catId,
      };
      this.dashService.createItem(this.outletId, catId, dto).subscribe({
        next: () => { this.toastService.success('Item created'); this.reloadItems(catId); },
        error: () => this.toastService.error('Failed to create item')
      });
    });
  }

  openEditItem(item: any, event: Event): void {
    event.stopPropagation();
    const cat = this.categories().find(c => c.categoryId === item.categoryId);
    this.modalService.openEditItem(item, cat?.name ?? '').subscribe((value: any) => {
      if (!value || !item.itemId) return;
      const dto = {
        name:        value.name ?? item.name,
        description: value.description ?? item.description ?? '',
        price:       value.price ?? item.price ?? 0,
        type:        value.type ?? item.type ?? 'VEG',
        available:   value.available ?? item.available ?? true,
        imageUrl:    value.image_url ?? item.imageUrl ?? '',
        categoryId:  item.categoryId,
      };
      this.dashService.updateItem(this.outletId, item.categoryId, item.itemId, dto).subscribe({
        next: () => { this.toastService.success('Item updated'); this.reloadItems(item.categoryId); },
        error: () => this.toastService.error('Failed to update item')
      });
    });
  }

  confirmDeleteItem(item: any, catId: number, event: Event): void {
    event.stopPropagation();
    if (!item.itemId) return;
    this.modalService.openConfirm({ title: 'Delete Item', message: `Delete "${item.name}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.dashService.deleteItem(this.outletId, catId, item.itemId).subscribe({
          next: () => { this.toastService.success('Item deleted'); this.reloadItems(catId); },
          error: () => this.toastService.error('Failed to delete item')
        });
      });
  }

  toggleAvailability(item: any, event: Event): void {
    event.stopPropagation();
    if (!item.itemId || !item.categoryId) return;
    const newVal = !item.available;
    const sig = this.itemsCache.get(item.categoryId);
    if (sig) sig.update(list => list.map(i => i.itemId === item.itemId ? { ...i, available: newVal } : i));
    this.dashService.toggleItemAvailability(this.outletId, item.categoryId, item.itemId, newVal)
      .subscribe({
        error: () => {
          if (sig) sig.update(list => list.map(i => i.itemId === item.itemId ? { ...i, available: !newVal } : i));
          this.toastService.error('Toggle failed');
        }
      });
  }
}
