import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AddressDto } from './services/address.service';

@Component({
  selector: 'app-address-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './address-detail-panel.component.html',
  styleUrl: './address-detail-panel.component.scss',
})
export class AddressDetailPanelComponent implements OnChanges {
  @Input() address: AddressDto | null = null;
  @Input() loading = false;
  @Output() save = new EventEmitter<Partial<AddressDto>>();
  @Output() remove = new EventEmitter<void>();

  readonly editing = signal(false);
  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      doorNo: [''],
      buildingName: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
      instructions: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['address'] && this.address) {
      this.form.patchValue(this.address);
    }
  }

  startEdit(): void {
    if (this.address) this.form.patchValue(this.address);
    else this.form.reset();
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.value);
    this.editing.set(false);
  }

  get addressFields(): Array<{ label: string; value: string }> {
    const a = this.address;
    if (!a) return [];
    const addressLine = [a.addressLine1, a.addressLine2].filter(v => !!v).join(', ');
    const raw: Array<{ label: string; value: string | undefined }> = [
      { label: 'Door No',      value: a.doorNo },
      { label: 'Building',     value: a.buildingName },
      { label: 'Address',      value: addressLine || undefined },
      { label: 'City',         value: a.city },
      { label: 'State',        value: a.state },
      { label: 'Zip',          value: a.zipCode },
      { label: 'Country',      value: a.country },
      { label: 'Instructions', value: a.instructions }
    ];
    return raw.filter(f => !!f.value) as Array<{ label: string; value: string }>;
  }
}
