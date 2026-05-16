import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';

export interface OfferModalData { offer?: Record<string, unknown>; }

const OFFER_TYPES = [
  { value: 'PERCENTAGE',    label: 'Percentage Discount',  discountLabel: 'Discount % (0–100)' },
  { value: 'FLAT',          label: 'Flat Amount Off',       discountLabel: 'Discount Amount (₹)' },
  { value: 'FREE_DELIVERY', label: 'Free Delivery',         discountLabel: null },
  { value: 'BUY_X_GET_Y',   label: 'Buy X Get Y',           discountLabel: 'Discount Amount (₹)' },
];

@Component({
  selector: 'app-offer-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './offer-form-modal.component.html',
  styleUrl:    './offer-form-modal.component.scss',
})
export class OfferFormModalComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEdit    = signal(false);
  readonly offerTypes = OFFER_TYPES;

  readonly form = this.fb.group({
    offer_name:        ['', [Validators.required, Validators.maxLength(255)]],
    offer_code:        ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/^[A-Z0-9_]+$/)]],
    offer_description: ['', Validators.maxLength(2000)],
    offer_type:        ['PERCENTAGE', Validators.required],
    offer_discount:    [null as number | null],
    buy_qty:           [null as number | null, Validators.min(1)],
    get_qty:           [null as number | null, Validators.min(1)],
  });

  get title():    string { return this.isEdit() ? 'Edit Offer' : 'Create Offer'; }
  get subtitle(): string { return this.isEdit() ? 'Update offer details' : 'Set up a discount or promo code'; }

  get isFreeDelivery(): boolean { return this.form.get('offer_type')?.value === 'FREE_DELIVERY'; }
  get isBuyXGetY():     boolean { return this.form.get('offer_type')?.value === 'BUY_X_GET_Y'; }

  get currentTypeConfig() {
    return OFFER_TYPES.find(t => t.value === this.form.get('offer_type')?.value) ?? OFFER_TYPES[0];
  }

  constructor(
    private readonly dialogRef: MatDialogRef<OfferFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: OfferModalData,
  ) {}

  ngOnInit(): void {
    this.form.get('offer_code')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        const clean = (v ?? '').toUpperCase().replace(/[^A-Z0-9_]/g, '');
        if (clean !== v) {
          this.form.get('offer_code')!.setValue(clean, { emitEvent: false });
        }
      });

    this.form.get('offer_name')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        if (name && !this.form.get('offer_code')!.dirty) {
          const base = (name ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6);
          const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
          this.form.patchValue({ offer_code: `${base}${rand}` }, { emitEvent: false });
        }
      });

    if (this.data?.offer) {
      this.isEdit.set(true);
      const o = this.data.offer;
      this.form.patchValue({
        offer_name:        String(o['offerName'] ?? o['name'] ?? ''),
        offer_code:        String(o['offerCode'] ?? o['code'] ?? ''),
        offer_description: String(o['offerDescription'] ?? ''),
        offer_type:        String(o['offerType'] ?? o['discountType'] ?? 'PERCENTAGE'),
        offer_discount:    (o['offerDiscount'] as number ?? o['discountValue'] as number ?? null),
      });
    }
  }

  generateCode(): void {
    const name = this.form.get('offer_name')?.value ?? '';
    const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    this.form.patchValue({ offer_code: `${base}${rand}` });
    this.form.get('offer_code')?.markAsDirty();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
