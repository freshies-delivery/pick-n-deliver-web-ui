import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ImageSearchComponent } from '../../shared/components/image-search/image-search.component';
import { ItemDto } from './services/item.service';

export interface ItemModalData {
  outletId?: number;
  categoryId?: number;
  categoryName?: string;
  item?: ItemDto;
}

const FOOD_TYPES = [
  { value: 'VEG',     label: 'Veg',      color: '#22C55E' },
  { value: 'NON_VEG', label: 'Non-Veg',  color: '#EF4444' },
  { value: 'EGG',     label: 'Egg',      color: '#F59E0B' },
  { value: 'VEGAN',   label: 'Vegan',    color: '#A3E635' },
];

@Component({
  selector: 'app-item-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ImageSearchComponent, ReactiveFormsModule],
  templateUrl: './item-form-modal.component.html',
  styleUrl:    './item-form-modal.component.scss',
})
export class ItemFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly isEdit    = signal(false);
  readonly foodTypes = FOOD_TYPES;

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(500)],
    type:        ['VEG'],
    price:       [null as number | null, [Validators.min(0)]],
    available:   [true],
    image_url:   [''],
  });

  get title():    string { return this.isEdit() ? `Edit ${this.data?.item?.name ?? 'Item'}` : 'Add Item'; }
  get subtitle(): string {
    const n = this.data?.categoryName ?? '';
    return n ? `${this.isEdit() ? 'Editing' : 'Adding'} item in ${n}` : '';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<ItemFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: ItemModalData,
  ) {}

  ngOnInit(): void {
    if (this.data?.item) {
      this.isEdit.set(true);
      const i = this.data.item;
      this.form.patchValue({
        name: i.name, description: i.description ?? '',
        type: i.type ?? 'VEG', price: i.price ?? null, available: i.available ?? true,
        image_url: i.imageUrl ?? '',
      });
    }
  }

  toggle(): void {
    this.form.patchValue({ available: !this.form.get('available')!.value });
  }

  onImage(url: string): void { this.form.patchValue({ image_url: url }); }
  clearImage(): void          { this.form.patchValue({ image_url: '' }); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
