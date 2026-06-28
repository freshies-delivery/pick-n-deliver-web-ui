import {
  Component, Inject, Optional, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ItemService, ItemDto } from './services/item.service';

export interface OutletOrderModalData {
  outletId: number;
  outletName?: string;
}

/** A selected item line (UI state) before it's mapped to an OutletOrderItemDto on save. */
interface OrderLine {
  itemId: number;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-outlet-order-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './outlet-order-form-modal.component.html',
  styleUrl: './outlet-order-form-modal.component.scss',
})
export class OutletOrderFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);

  readonly form = this.fb.group({
    userId:     [null as number | null, [Validators.required, Validators.min(1)]],
    type:       ['DELIVERY', Validators.required],
    notes:      [''],
    requestBag: [false],
  });

  readonly loadingItems = signal(true);
  readonly items        = signal<ItemDto[]>([]);
  readonly lines        = signal<OrderLine[]>([]);

  readonly total = computed(() =>
    this.lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));

  /** Items not yet added, so the picker only offers things you haven't selected. */
  readonly availableItems = computed(() => {
    const chosen = new Set(this.lines().map(l => l.itemId));
    return this.items().filter(i => i.itemId != null && !chosen.has(i.itemId));
  });

  get title(): string { return 'New Order'; }
  get subtitle(): string {
    return this.data?.outletName ? `Create order for ${this.data.outletName}` : 'Create a new order';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<OutletOrderFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: OutletOrderModalData,
  ) {}

  ngOnInit(): void {
    if (!this.data?.outletId) { this.loadingItems.set(false); return; }
    this.itemService.list(this.data.outletId)
      .pipe(finalize(() => this.loadingItems.set(false)))
      .subscribe({
        next: list => this.items.set(list.filter(i => i.available !== false)),
        error: () => this.items.set([]),
      });
  }

  addItem(itemIdRaw: string): void {
    const itemId = Number(itemIdRaw);
    if (!itemId) return;
    const item = this.items().find(i => i.itemId === itemId);
    if (!item) return;
    this.lines.update(lines => {
      if (lines.some(l => l.itemId === itemId)) {
        return lines.map(l => l.itemId === itemId ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...lines, { itemId, itemName: item.name, unitPrice: item.price ?? 0, quantity: 1 }];
    });
  }

  changeQty(itemId: number, delta: number): void {
    this.lines.update(lines => lines
      .map(l => l.itemId === itemId ? { ...l, quantity: l.quantity + delta } : l)
      .filter(l => l.quantity > 0));
  }

  setQty(itemId: number, value: string): void {
    const q = Math.max(0, Math.floor(Number(value) || 0));
    this.lines.update(lines => lines
      .map(l => l.itemId === itemId ? { ...l, quantity: q } : l)
      .filter(l => l.quantity > 0));
  }

  removeLine(itemId: number): void {
    this.lines.update(lines => lines.filter(l => l.itemId !== itemId));
  }

  formatAmount(v: number): string {
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  save(): void {
    if (this.form.invalid || this.lines().length === 0) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.dialogRef.close({
      outletId:   this.data?.outletId,
      userId:     v.userId,
      type:       v.type,
      notes:      v.notes || null,
      requestBag: v.requestBag ?? false,
      orderItems: this.lines().map(l => ({
        itemId:    l.itemId,
        itemName:  l.itemName,
        quantity:  l.quantity,
        unitPrice: l.unitPrice,
      })),
    });
  }

  close(): void { this.dialogRef.close(); }
}
