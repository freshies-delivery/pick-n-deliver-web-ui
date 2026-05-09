import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  OnChanges,
  SimpleChanges,
  computed,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AddressDto } from './services/address.service';

@Component({
  selector: 'app-map-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './map-panel.component.html',
  styleUrl: './map-panel.component.scss',
})
export class MapPanelComponent implements OnChanges {
  @Input() address: AddressDto | null = null;
  @Output() coordsUpdate = new EventEmitter<{ latitude: number; longitude: number }>();

  readonly showCoordForm = signal(false);
  coordForm: FormGroup;

  readonly hasCoords = computed(() => !!(this.address?.latitude && this.address?.longitude));

  mapUrl: SafeResourceUrl | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly sanitizer: DomSanitizer
  ) {
    this.coordForm = this.fb.group({
      latitude: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      longitude: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['address'] && this.address?.latitude && this.address?.longitude) {
      const lat = this.address.latitude;
      const lng = this.address.longitude;
      const url = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.coordForm.patchValue({ latitude: lat, longitude: lng });
    } else {
      this.mapUrl = null;
    }
  }

  toggleCoordForm(): void {
    this.showCoordForm.update(v => !v);
  }

  submitCoords(): void {
    if (this.coordForm.invalid) return;
    const { latitude, longitude } = this.coordForm.value;
    this.coordsUpdate.emit({ latitude: +latitude, longitude: +longitude });
    this.showCoordForm.set(false);
  }
}
