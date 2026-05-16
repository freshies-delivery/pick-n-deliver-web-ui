import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClientFormModalComponent }          from '../../features/client/client-form-modal.component';
import { OutletFormModalComponent }          from '../../features/client/outlet-form-modal.component';
import { CategoryFormModalComponent }        from '../../features/client/category-form-modal.component';
import { ItemFormModalComponent }            from '../../features/client/item-form-modal.component';
import { SegmentFormModalComponent }         from '../../features/admin/segment-form-modal.component';
import { OfferFormModalComponent }           from '../../features/admin/offer-form-modal.component';
import { NotificationFormModalComponent }    from '../../features/admin/notification-form-modal.component';
import { UserFormModalComponent }            from '../../features/user/user-form-modal.component';
import { DeliveryPartnerFormModalComponent } from '../../features/admin/delivery-partner-form-modal.component';
import { AddressFormModalComponent }         from '../../features/user/address-form-modal.component';

import { ClientDto }   from '../../features/client/services/client.service';
import { OutletDto }   from '../../features/client/services/outlet.service';
import { CategoryDto } from '../../features/client/services/category.service';
import { ItemDto }     from '../../features/client/services/item.service';
import { UserDto }     from '../../features/user/services/user.service';
import { AddressDto }  from '../../features/user/services/address.service';

const BASE: MatDialogConfig = {
  backdropClass: 'swiftly-modal-backdrop',
  panelClass:    'swiftly-modal-panel',
  autoFocus:     false,
  restoreFocus:  false,
  maxWidth:      '95vw',
};

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(MatDialog);

  // ── Client ──────────────────────────────────────────────────────────────

  openAddClient(): Observable<Partial<ClientDto> | undefined> {
    return this.dialog.open(ClientFormModalComponent, { ...BASE, width: '580px' }).afterClosed();
  }

  openEditClient(client: ClientDto): Observable<Partial<ClientDto> | undefined> {
    return this.dialog.open(ClientFormModalComponent, { ...BASE, width: '580px', data: { client } }).afterClosed();
  }

  // ── Outlet ──────────────────────────────────────────────────────────────

  openAddOutlet(clientId: number, clientName: string): Observable<Partial<OutletDto> | undefined> {
    return this.dialog.open(OutletFormModalComponent, { ...BASE, width: '720px', data: { clientId, clientName } }).afterClosed();
  }

  openEditOutlet(outlet: OutletDto): Observable<Partial<OutletDto> | undefined> {
    return this.dialog.open(OutletFormModalComponent, { ...BASE, width: '720px', data: { outlet } }).afterClosed();
  }

  // ── Category ────────────────────────────────────────────────────────────

  openAddCategory(outletId: number, outletName: string): Observable<Partial<CategoryDto> | undefined> {
    return this.dialog.open(CategoryFormModalComponent, { ...BASE, width: '580px', data: { outletId, outletName } }).afterClosed();
  }

  openEditCategory(category: CategoryDto, outletName = ''): Observable<Partial<CategoryDto> | undefined> {
    return this.dialog.open(CategoryFormModalComponent, { ...BASE, width: '580px', data: { category, outletName } }).afterClosed();
  }

  // ── Item ────────────────────────────────────────────────────────────────

  openAddItem(outletId: number, categoryId: number, categoryName: string): Observable<Partial<ItemDto> | undefined> {
    return this.dialog.open(ItemFormModalComponent, { ...BASE, width: '720px', data: { outletId, categoryId, categoryName } }).afterClosed();
  }

  openEditItem(item: ItemDto, categoryName = ''): Observable<Partial<ItemDto> | undefined> {
    return this.dialog.open(ItemFormModalComponent, { ...BASE, width: '720px', data: { item, categoryName } }).afterClosed();
  }

  // ── Segment ─────────────────────────────────────────────────────────────

  openAddSegment(): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(SegmentFormModalComponent, { ...BASE, width: '580px' }).afterClosed();
  }

  openEditSegment(segment: Record<string, unknown>): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(SegmentFormModalComponent, { ...BASE, width: '580px', data: { segment } }).afterClosed();
  }

  // ── Offer ───────────────────────────────────────────────────────────────

  openAddOffer(): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(OfferFormModalComponent, { ...BASE, width: '720px' }).afterClosed();
  }

  openEditOffer(offer: Record<string, unknown>): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(OfferFormModalComponent, { ...BASE, width: '720px', data: { offer } }).afterClosed();
  }

  // ── Notification ─────────────────────────────────────────────────────────

  openSendNotification(): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(NotificationFormModalComponent, { ...BASE, width: '720px' }).afterClosed();
  }

  // ── User ────────────────────────────────────────────────────────────────

  openAddUser(): Observable<Partial<UserDto> | undefined> {
    return this.dialog.open(UserFormModalComponent, { ...BASE, width: '440px' }).afterClosed();
  }

  openEditUser(user: UserDto): Observable<Partial<UserDto> | undefined> {
    return this.dialog.open(UserFormModalComponent, { ...BASE, width: '440px', data: { user } }).afterClosed();
  }

  // ── Delivery Partner ────────────────────────────────────────────────────

  openAddDeliveryPartner(): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(DeliveryPartnerFormModalComponent, { ...BASE, width: '440px' }).afterClosed();
  }

  openEditDeliveryPartner(partner: Record<string, unknown>): Observable<Record<string, unknown> | undefined> {
    return this.dialog.open(DeliveryPartnerFormModalComponent, { ...BASE, width: '440px', data: { partner } }).afterClosed();
  }

  // ── Address ─────────────────────────────────────────────────────────────

  openAddAddress(userId: number): Observable<Partial<AddressDto> | undefined> {
    return this.dialog.open(AddressFormModalComponent, { ...BASE, width: '720px', data: { userId } }).afterClosed();
  }

  openEditAddress(userId: number, address: AddressDto): Observable<Partial<AddressDto> | undefined> {
    return this.dialog.open(AddressFormModalComponent, { ...BASE, width: '720px', data: { userId, address } }).afterClosed();
  }

  // ── Confirm ─────────────────────────────────────────────────────────────

  openConfirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, { ...BASE, width: '420px', data }).afterClosed();
  }
}
