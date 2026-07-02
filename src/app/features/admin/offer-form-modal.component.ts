import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { OfferPayload, OfferType } from './offer.service';

export interface OfferModalData { offer?: Record<string, unknown>; }

const OFFER_TYPES: { value: OfferType; label: string; discountLabel: string | null }[] = [
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
    offer_type:        ['PERCENTAGE' as OfferType, Validators.required],
    offer_discount:    [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    offer_expiry:      [''],
  });

  get title():    string { return this.isEdit() ? 'Edit Offer' : 'Create Offer'; }
  get subtitle(): string { return this.isEdit() ? 'Update offer details' : 'Set up a discount or promo code'; }

  get isFreeDelivery(): boolean { return this.form.get('offer_type')?.value === 'FREE_DELIVERY'; }

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

    // Discount is only relevant/required for non-free-delivery types, and the
    // 0–100 ceiling only applies to percentages.
    this.form.get('offer_type')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(type => this.applyDiscountValidators(type as OfferType));

    if (this.data?.offer) {
      this.isEdit.set(true);
      const o = this.data.offer;
      this.form.patchValue({
        offer_name:        String(o['offerName'] ?? ''),
        offer_code:        String(o['offerCode'] ?? ''),
        offer_description: String(o['offerDescription'] ?? ''),
        offer_type:        (o['offerType'] as OfferType) ?? 'PERCENTAGE',
        offer_discount:    (o['offerDiscount'] as number) ?? null,
        offer_expiry:      this.toDateInput(o['offerExpiry']),
      });
      this.form.get('offer_code')!.markAsDirty();
    }

    this.applyDiscountValidators(this.form.get('offer_type')!.value as OfferType);
  }

  private applyDiscountValidators(type: OfferType): void {
    const disc = this.form.get('offer_discount')!;
    if (type === 'FREE_DELIVERY') {
      disc.clearValidators();
    } else if (type === 'PERCENTAGE') {
      disc.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else {
      disc.setValidators([Validators.required, Validators.min(0)]);
    }
    disc.updateValueAndValidity({ emitEvent: false });
  }

  /** Format a Date / ISO string into the yyyy-MM-dd a date input expects. */
  private toDateInput(value: unknown): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(String(value));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  /** Open the native date picker when the field itself is clicked (not just the icon). */
  openPicker(input: HTMLInputElement): void {
    input.showPicker?.();
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
    const v = this.form.value;
    const expiry = v.offer_expiry ? `${v.offer_expiry}T23:59:59` : null;
    const payload: OfferPayload = {
      offerName:        (v.offer_name ?? '').trim(),
      offerCode:        (v.offer_code ?? '').trim(),
      offerDescription: (v.offer_description ?? '').trim(),
      offerType:        v.offer_type as OfferType,
      offerDiscount:    this.isFreeDelivery ? 0 : Number(v.offer_discount ?? 0),
      offerExpiry:      expiry,
    };
    this.dialogRef.close(payload);
  }

  close(): void { this.dialogRef.close(); }
}
