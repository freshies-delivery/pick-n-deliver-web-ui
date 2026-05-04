import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { UserContextService } from '../../core/services/user-context.service';
import { AddressDto, AddressService } from './services/address.service';

@Component({
  selector: 'app-user-addresses',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent, RouterLink, RouterLinkActive],
  templateUrl: './user-addresses.component.html',
  styleUrl: './user-addresses.component.scss'
})
export class UserAddressesComponent implements OnInit {
  readonly userId = signal(0);
  readonly loading = signal(false);
  readonly addresses = signal<AddressDto[]>([]);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly columns: ColumnConfig[] = [
    { key: 'addressLine1', label: 'Address Line' },
    { key: 'city', label: 'City' },
    { key: 'zipCode', label: 'Pincode' },
    { key: 'label', label: 'Label' },
    { key: 'favorite', label: 'Default', type: 'boolean' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { key: 'addressLine2', label: 'Address Line 2', type: 'text' },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'Pincode', type: 'text', required: true },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'label', label: 'Label (Home/Work)', type: 'text' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add Address',
      icon: 'add',
      type: 'primary',
      action: () => this.openCreateDialog()
    }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly addressService: AddressService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading.set(true);
    this.addressService
      .listForUser(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (addresses) => this.addresses.set(addresses),
        error: () => this.snackBar.open('Unable to load addresses', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<AddressDto>, {
        data: { title: 'Add Address', fields: this.fields }
      })
      .afterClosed()
      .subscribe((value: Partial<AddressDto> | undefined) => {
        if (!value) return;
        this.addressService.create({ ...value, userId: this.userId() } as AddressDto).subscribe({
          next: () => {
            this.snackBar.open('Address added', 'Close', { duration: 2500 });
            this.loadAddresses();
          },
          error: () => this.snackBar.open('Failed to add address', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(address: AddressDto): void {
    this.dialog
      .open(GenericFormDialogComponent<AddressDto>, {
        data: { title: 'Edit Address', fields: this.fields, initialValue: address }
      })
      .afterClosed()
      .subscribe((value: Partial<AddressDto> | undefined) => {
        if (!value || !address.addressId) return;
        this.addressService.update(address.addressId, { ...address, ...value }).subscribe({
          next: () => {
            this.snackBar.open('Address updated', 'Close', { duration: 2500 });
            this.loadAddresses();
          },
          error: () => this.snackBar.open('Failed to update address', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(address: AddressDto): void {
    if (!address.addressId) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete Address', message: 'Are you sure you want to remove this address?' }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.addressService.delete(address.addressId!).subscribe({
          next: () => {
            this.snackBar.open('Address deleted', 'Close', { duration: 2500 });
            this.loadAddresses();
          },
          error: () => this.snackBar.open('Failed to delete address', 'Close', { duration: 3000 })
        });
      });
  }
}
