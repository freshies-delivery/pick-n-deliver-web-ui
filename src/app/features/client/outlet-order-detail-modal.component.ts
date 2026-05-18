import {
  Component, Inject, Optional, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { apiUrl } from '../../core/api.config';

export interface DashOrderDetailDto {
  orderId?: number;
  status?: string;
  type?: string;
  totalAmount?: number;
  taxDetails?: string;
  requestBag?: boolean;
  notes?: string;
  orderTime?: string;
  userId?: number;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  outletId?: number;
  outletName?: string;
  outletType?: string;
  outletAddressLine?: string;
  outletLat?: number;
  outletLng?: number;
  deliveryAddressId?: number;
  deliveryAddressLine?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryLabel?: string;
  deliveryInstructions?: string;
  receiverName?: string;
  receiverPhone?: string;
  items?: DashOrderLineDto[];
  offerId?: number;
  offerName?: string;
  offerCode?: string;
  offerDiscount?: number;
  partnerId?: number;
  partnerName?: string;
  partnerPhone?: string;
  partnerVehicleType?: string;
  paymentStatus?: string;
  paymentProvider?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
}

export interface DashOrderLineDto {
  itemId?: number;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface OrderDetailModalData {
  orderId: number;
}

@Component({
  selector: 'app-outlet-order-detail-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, StatusBadgeComponent, SpinnerComponent],
  templateUrl: './outlet-order-detail-modal.component.html',
  styleUrl: './outlet-order-detail-modal.component.scss',
})
export class OutletOrderDetailModalComponent implements OnInit {
  private readonly http      = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly order   = signal<DashOrderDetailDto | null>(null);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  get title(): string { return this.order() ? `Order #${this.order()!.orderId}` : 'Order Detail'; }
  get subtitle(): string { return this.order()?.outletName ?? ''; }

  constructor(
    private readonly dialogRef: MatDialogRef<OutletOrderDetailModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: OrderDetailModalData,
  ) {}

  ngOnInit(): void {
    this.http.get<DashOrderDetailDto>(apiUrl(`/api/dashboard/orders/${this.data.orderId}`))
      .subscribe({
        next: detail => { this.order.set(detail); this.loading.set(false); },
        error: () => { this.error.set('Failed to load order details'); this.loading.set(false); },
      });
  }

  get detail(): DashOrderDetailDto { return this.order()!; }

  get directionsEmbedUrl(): SafeResourceUrl | null {
    const o = this.order();
    if (!o?.outletLat || !o?.outletLng || !o?.deliveryLat || !o?.deliveryLng) return null;
    const url = `https://maps.google.com/maps?saddr=${o.outletLat},${o.outletLng}&daddr=${o.deliveryLat},${o.deliveryLng}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get directionsLinkUrl(): string | null {
    const o = this.order();
    if (!o?.outletLat || !o?.outletLng || !o?.deliveryLat || !o?.deliveryLng) return null;
    return `https://www.google.com/maps/dir/${o.outletLat},${o.outletLng}/${o.deliveryLat},${o.deliveryLng}`;
  }

  close(): void { this.dialogRef.close(); }

  fmt(v?: number | null): string {
    if (v == null) return '—';
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
