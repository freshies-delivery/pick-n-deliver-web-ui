import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AddressDetailPanelComponent } from './address-detail-panel.component';
import { MapPanelComponent } from './map-panel.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';

@Component({
  selector: 'app-outlet-address',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AddressDetailPanelComponent, MapPanelComponent, SkeletonListComponent],
  templateUrl: './outlet-address.component.html',
  styleUrl: './outlet-address.component.scss'
})
export class OutletAddressComponent implements OnChanges {
  @Input() outletId = 0;

  readonly loading = signal(false);
  readonly address = signal<any | null>(null);

  private readonly dashService  = inject(AppDashService);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId'] && this.outletId) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dashService.getOutletAddress(this.outletId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: addr => this.address.set(addr ?? null),
        error: () => this.address.set(null)
      });
  }

  saveAddress(value: any): void {
    const current = this.address();
    const payload = {
      doorNo:       value.doorNo      ?? value.door_no      ?? current?.doorNo      ?? '',
      buildingName: value.buildingName ?? value.building_name ?? current?.buildingName ?? '',
      addressLine1: value.addressLine1 ?? value.address_line1 ?? current?.addressLine1 ?? '',
      addressLine2: value.addressLine2 ?? value.address_line2 ?? current?.addressLine2 ?? '',
      city:         value.city        ?? current?.city        ?? '',
      state:        value.state       ?? current?.state       ?? '',
      zipCode:      value.zipCode     ?? value.zip_code       ?? current?.zipCode     ?? '',
      country:      value.country     ?? current?.country     ?? 'India',
      instructions: value.instructions ?? current?.instructions ?? '',
      latitude:     value.latitude    ?? current?.latitude    ?? null,
      longitude:    value.longitude   ?? current?.longitude   ?? null,
      type:         value.type        ?? current?.type        ?? 'OUTLET',
    };

    if (current?.addressId) {
      this.dashService.updateOutletAddress(this.outletId, current.addressId, payload)
        .subscribe({
          next: updated => { this.address.set(updated); this.toastService.success('Address updated'); },
          error: () => this.toastService.error('Failed to save address')
        });
    } else {
      this.dashService.upsertOutletAddress(this.outletId, payload)
        .subscribe({
          next: created => { this.address.set(created); this.toastService.success('Address saved'); },
          error: () => this.toastService.error('Failed to save address')
        });
    }
  }

  removeAddress(): void {
    const current = this.address();
    if (!current?.addressId) return;
    this.modalService.openConfirm({ title: 'Delete Address', message: 'Delete this address permanently?' })
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.dashService.deleteOutletAddress(this.outletId, current.addressId)
          .subscribe({
            next: () => { this.address.set(null); this.toastService.success('Address deleted'); },
            error: () => this.toastService.error('Failed to delete')
          });
      });
  }

  updateCoords(coords: { latitude: number; longitude: number }): void {
    const current = this.address();
    if (!current) { this.toastService.error('Add an address first'); return; }
    const payload = { ...current, ...coords };
    if (current.addressId) {
      this.dashService.updateOutletAddress(this.outletId, current.addressId, payload)
        .subscribe({
          next: updated => { this.address.set(updated); this.toastService.success('Coordinates updated'); },
          error: () => this.toastService.error('Failed to update coordinates')
        });
    } else {
      this.dashService.upsertOutletAddress(this.outletId, payload)
        .subscribe({
          next: created => { this.address.set(created); this.toastService.success('Coordinates updated'); },
          error: () => this.toastService.error('Failed to update coordinates')
        });
    }
  }
}
