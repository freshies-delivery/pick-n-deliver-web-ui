import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { UserContextService } from '../../core/services/user-context.service';
import { AddressDto, AddressService } from './services/address.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-addresses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SkeletonListComponent,
    EmptyStateComponent,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './user-addresses.component.html',
  styleUrl: './user-addresses.component.scss',
})
export class UserAddressesComponent implements OnInit {
  readonly userId    = signal(0);
  readonly loading   = signal(false);
  readonly addresses = signal<AddressDto[]>([]);
  readonly selectedId= signal<number | null>(null);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Address', icon: 'add', type: 'primary', action: () => this.openCreateDialog() },
  ];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly addressService: AddressService,
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
        next: addrs => {
          this.addresses.set(addrs);
          const def = addrs.find(a => a.favorite);
          if (def?.addressId) this.selectedId.set(def.addressId);
        },
        error: () => this.toastService.error('Unable to load addresses'),
      });
  }

  openCreateDialog(): void {
    this.modalService.openAddAddress(this.userId()).subscribe(value => {
      if (!value) return;
      this.addressService.create({ ...value, userId: this.userId() } as AddressDto).subscribe({
        next: () => { this.toastService.success('Address added'); this.loadAddresses(); },
        error: () => this.toastService.error('Failed to add address'),
      });
    });
  }

  openEditDialog(address: AddressDto): void {
    this.modalService.openEditAddress(this.userId(), address).subscribe(value => {
      if (!value || !address.addressId) return;
      this.addressService.update(address.addressId, { ...address, ...value }).subscribe({
        next: () => { this.toastService.success('Address updated'); this.loadAddresses(); },
        error: () => this.toastService.error('Failed to update address'),
      });
    });
  }

  confirmDelete(address: AddressDto): void {
    if (!address.addressId) return;
    this.modalService.openConfirm({ title: 'Delete Address', message: 'Remove this address?' })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.addressService.delete(address.addressId!).subscribe({
          next: () => { this.toastService.success('Address deleted'); this.loadAddresses(); },
          error: () => this.toastService.error('Failed to delete address'),
        });
      });
  }

  selectAddress(id: number): void {
    this.selectedId.set(id);
  }

  addrLabel(address: AddressDto): string {
    return (address.label ?? 'other').toLowerCase();
  }

  addrLines(address: AddressDto): string {
    return [address.addressLine1, address.addressLine2, address.city, address.state, address.zipCode]
      .filter(Boolean)
      .join(', ');
  }
}
