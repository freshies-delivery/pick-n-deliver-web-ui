import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalComponent } from '../../shared/components/modal/modal.component';

export interface DeliveryPartnerModalData { partner?: Record<string, unknown>; }

const VEHICLE_TYPES = [
  { value: 'BIKE',    label: 'Bike / Motorcycle' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'CAR',     label: 'Car' },
  { value: 'AUTO',    label: 'Auto Rickshaw' },
  { value: 'VAN',     label: 'Van / Mini Truck' },
];

@Component({
  selector: 'app-delivery-partner-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './delivery-partner-form-modal.component.html',
  styleUrl:    './delivery-partner-form-modal.component.scss',
})
export class DeliveryPartnerFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly isEdit       = signal(false);
  readonly vehicleTypes = VEHICLE_TYPES;

  readonly form = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(255)]],
    phone:          ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/^[+0-9\s\-()]{7,20}$/)]],
    vehicle_type:   ['BIKE', Validators.required],
    vehicle_no:     [''],
    created_source: ['ADMIN_PORTAL'],
    is_active:      [true],
  });

  get title():    string { return this.isEdit() ? 'Edit Delivery Partner' : 'Add Delivery Partner'; }
  get subtitle(): string { return this.isEdit() ? 'Update partner details' : 'Onboard a new delivery partner'; }

  constructor(
    private readonly dialogRef: MatDialogRef<DeliveryPartnerFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: DeliveryPartnerModalData,
  ) {}

  ngOnInit(): void {
    if (this.data?.partner) {
      this.isEdit.set(true);
      const p = this.data.partner;
      this.form.patchValue({
        name:           (p['name'] as string) ?? '',
        phone:          (p['phone'] as string) ?? '',
        vehicle_type:   (p['vehicleType'] as string) ?? 'BIKE',
        vehicle_no:     (p['vehicleNo'] as string) ?? '',
        created_source: (p['createdSource'] as string) ?? 'ADMIN_PORTAL',
        is_active:      (p['isActive'] as boolean) ?? true,
      });
    }
  }

  toggle(): void {
    this.form.patchValue({ is_active: !this.form.get('is_active')!.value });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
