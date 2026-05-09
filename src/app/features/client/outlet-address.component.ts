import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AddressDetailPanelComponent } from './address-detail-panel.component';
import { MapPanelComponent } from './map-panel.component';
import { AddressDto, AddressService } from './services/address.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';

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
  readonly address = signal<AddressDto | null>(null);

  constructor(
    private readonly addressService: AddressService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId'] && this.outletId) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.addressService.listByOutlet(this.outletId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: list => this.address.set(list[0] ?? null),
      error: () => this.snackBar.open('Unable to load address', 'Close', { duration: 3000 })
    });
  }

  saveAddress(value: Partial<AddressDto>): void {
    const current = this.address();
    const payload: AddressDto = { ...current, ...value, outletId: this.outletId };
    const req = current?.addressId
      ? this.addressService.update(current.addressId, payload)
      : this.addressService.create(payload);
    req.subscribe({
      next: () => { this.snackBar.open('Address saved', 'Close', { duration: 2500 }); this.load(); },
      error: () => this.snackBar.open('Failed to save address', 'Close', { duration: 3000 })
    });
  }

  removeAddress(): void {
    const current = this.address();
    if (!current?.addressId) return;
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Address', message: 'Delete this address permanently?' } })
      .afterClosed().subscribe((ok: boolean) => {
        if (!ok) return;
        this.addressService.delete(current.addressId!).subscribe({
          next: () => { this.snackBar.open('Address deleted', 'Close', { duration: 2500 }); this.load(); },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
        });
      });
  }

  updateCoords(coords: { latitude: number; longitude: number }): void {
    const current = this.address();
    if (!current) { this.snackBar.open('Add an address first', 'Close', { duration: 3000 }); return; }
    const payload: AddressDto = { ...current, ...coords, outletId: this.outletId };
    const req = current.addressId
      ? this.addressService.update(current.addressId, payload)
      : this.addressService.create(payload);
    req.subscribe({
      next: () => { this.snackBar.open('Coordinates updated', 'Close', { duration: 2500 }); this.load(); },
      error: () => this.snackBar.open('Failed to update coordinates', 'Close', { duration: 3000 })
    });
  }
}
