import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ImageSearchComponent } from '../../shared/components/image-search/image-search.component';
import { OutletDto } from './services/outlet.service';

export interface OutletModalData {
  clientId?: number;
  clientName?: string;
  outlet?: OutletDto;
}

const OUTLET_TYPES = ['RESTAURANT', 'CAFE', 'BAKERY', 'CLOUD_KITCHEN', 'GROCERY', 'PHARMACY', 'OTHER'];

@Component({
  selector: 'app-outlet-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ImageSearchComponent, ReactiveFormsModule],
  templateUrl: './outlet-form-modal.component.html',
  styleUrl:    './outlet-form-modal.component.scss',
})
export class OutletFormModalComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEdit      = signal(false);
  readonly locating    = signal(false);
  readonly outletTypes = OUTLET_TYPES;

  readonly form = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(255)]],
    description:        ['', Validators.maxLength(255)],
    type:               [''],
    outlet_uri:         [''],
    is_veg:             [false],
    is_pickup_available:[true],
    image_url:          [''],
    door_no:            [''],
    building_name:      [''],
    address_line1:      ['', Validators.required],
    address_line2:      [''],
    city:               ['', Validators.required],
    state:              ['', Validators.required],
    zip_code:           ['', Validators.required],
    country:            ['India'],
    instructions:       [''],
    latitude:           [null as number | null],
    longitude:          [null as number | null],
  });

  get title():    string { return this.isEdit() ? `Edit ${this.data?.outlet?.name ?? 'Outlet'}` : 'Add Outlet'; }
  get subtitle(): string {
    const n = this.data?.clientName ?? '';
    return n ? `${this.isEdit() ? 'Editing' : 'Adding'} outlet for ${n}` : '';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<OutletFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: OutletModalData,
  ) {}

  ngOnInit(): void {
    this.form.get('name')!.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        if (name && !this.form.get('outlet_uri')!.dirty) {
          this.form.patchValue({ outlet_uri: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }, { emitEvent: false });
        }
      });

    if (this.data?.outlet) {
      this.isEdit.set(true);
      const o = this.data.outlet;
      this.form.patchValue({
        name: o.name, description: o.description ?? '', type: o.type ?? '',
        outlet_uri: o.outletUri ?? '', is_veg: o.isVeg ?? false,
        is_pickup_available: o.isPickupAvailable ?? true,
      });
    }
  }

  toggle(field: 'is_veg' | 'is_pickup_available'): void {
    this.form.patchValue({ [field]: !this.form.get(field)!.value });
  }

  locateMe(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.form.patchValue({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        this.locating.set(false);
      },
      () => this.locating.set(false)
    );
  }

  onImage(url: string): void { this.form.patchValue({ image_url: url }); }
  clearImage(): void          { this.form.patchValue({ image_url: '' }); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
