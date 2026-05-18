import {
  Component, Inject, Optional, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from '../../shared/components/modal/modal.component';

export interface OutletOrderModalData {
  outletId: number;
  outletName?: string;
}

@Component({
  selector: 'app-outlet-order-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './outlet-order-form-modal.component.html',
  styleUrl: './outlet-order-form-modal.component.scss',
})
export class OutletOrderFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    userId:     [null as number | null, [Validators.required, Validators.min(1)]],
    type:       ['DELIVERY', Validators.required],
    notes:      [''],
    requestBag: [false],
  });

  get title(): string { return 'New Order'; }
  get subtitle(): string {
    return this.data?.outletName ? `Create order for ${this.data.outletName}` : 'Create a new order';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<OutletOrderFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: OutletOrderModalData,
  ) {}

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.dialogRef.close({
      outletId:   this.data?.outletId,
      userId:     v.userId,
      type:       v.type,
      notes:      v.notes || null,
      requestBag: v.requestBag ?? false,
    });
  }

  close(): void { this.dialogRef.close(); }
}
