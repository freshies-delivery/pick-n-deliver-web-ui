import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AddressDto } from './services/address.service';

export interface AddressModalData {
  userId?: number;
  address?: AddressDto;
}

const ADDRESS_TYPES = [
  { value: 'HOME',                label: 'Home' },
  { value: 'WORK',                label: 'Work' },
  { value: 'OUTLET',              label: 'Outlet' },
  { value: 'OTHER',               label: 'Other' },
];

@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './address-form-modal.component.html',
  styleUrl:    './address-form-modal.component.scss',
})
export class AddressFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly isEdit      = signal(false);
  readonly locating    = signal(false);
  readonly addrTypes   = ADDRESS_TYPES;

  readonly form = this.fb.group({
    type:          ['HOME'],
    label:         [''],
    door_no:       [''],
    building_name: [''],
    address_line1: [''],
    address_line2: [''],
    city:          [''],
    state:         [''],
    zip_code:      [''],
    country:       ['India'],
    instructions:  [''],
    receiver_name: [''],
    receiver_phone:[''],
    is_favorite:   [false],
    latitude:      [null as number | null],
    longitude:     [null as number | null],
  });

  readonly addressType = toSignal(
    this.form.controls['type'].valueChanges.pipe(startWith(this.form.controls['type'].value)),
    { initialValue: this.form.controls['type'].value as string | null }
  );
  readonly isOtherType = computed(() => this.addressType() === 'OTHER');

  get title():    string { return this.isEdit() ? 'Edit Address' : 'Add Address'; }
  get subtitle(): string { return this.isEdit() ? 'Update address details' : 'Save a new delivery address'; }

  constructor(
    private readonly dialogRef: MatDialogRef<AddressFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: AddressModalData,
  ) {}

  ngOnInit(): void {
    if (this.data?.address) {
      this.isEdit.set(true);
      const a = this.data.address;
      this.form.patchValue({
        type:          a.type ?? 'HOME',
        label:         a.label ?? '',
        door_no:       a.doorNo ?? '',
        building_name: a.buildingName ?? '',
        address_line1: a.addressLine1 ?? '',
        address_line2: a.addressLine2 ?? '',
        city:          a.city ?? '',
        state:         a.state ?? '',
        zip_code:      a.zipCode ?? '',
        country:       a.country ?? 'India',
        instructions:  a.instructions ?? '',
        receiver_name: a.receiverName ?? '',
        receiver_phone:a.receiverPhone ?? '',
        is_favorite:   a.favorite ?? false,
        latitude:      a.latitude ?? null,
        longitude:     a.longitude ?? null,
      });
    }
  }

  toggleFavorite(): void {
    this.form.patchValue({ is_favorite: !this.form.get('is_favorite')!.value });
  }

  locateMe(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.form.patchValue({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        this.locating.set(false);
      },
      () => this.locating.set(false),
    );
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
