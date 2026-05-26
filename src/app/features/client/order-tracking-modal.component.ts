import {
  Component, Inject, OnDestroy, OnInit,
  ChangeDetectionStrategy, signal, computed
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { apiUrl } from '../../core/api.config';
import { OrderSocketService } from '../../core/services/order-socket.service';

export interface OrderLogEntry {
  archiveId: number;
  orderId: number;
  outletId?: number | null;
  userId?: number | null;
  partnerId?: number | null;
  actionType: string;
  status: string | null;
  createdTime: string;
  archived: boolean;
  live?: boolean;
}

@Component({
  selector: 'app-order-tracking-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './order-tracking-modal.component.html',
  styleUrl: './order-tracking-modal.component.scss',
})
export class OrderTrackingModalComponent implements OnInit, OnDestroy {
  readonly orderId: number;

  readonly loading    = signal(true);
  readonly error      = signal<string | null>(null);
  readonly logs       = signal<OrderLogEntry[]>([]);
  readonly connected  = signal(false);
  readonly liveOrder  = signal<any>(null);

  readonly currentStatus = computed(() => {
    const live = this.liveOrder();
    if (live?.status) return live.status;
    const all = this.logs();
    return all.length > 0 ? (all[all.length - 1].status ?? '—') : '—';
  });

  private socketSub?: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { orderId: number },
    private readonly dialogRef: MatDialogRef<OrderTrackingModalComponent>,
    private readonly http: HttpClient,
    private readonly socketService: OrderSocketService,
  ) {
    this.orderId = data.orderId;
  }

  ngOnInit(): void {
    this.loadLogs();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  private loadLogs(): void {
    this.loading.set(true);
    this.http.get<OrderLogEntry[]>(apiUrl(`/api/orders/${this.orderId}/logs`))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: logs => this.logs.set(logs),
        error: () => this.error.set('Failed to load order history'),
      });
  }

  private connectSocket(): void {
    this.socketSub = this.socketService.watchOrder(this.orderId).subscribe({
      next: (data: any) => {
        this.connected.set(true);
        this.liveOrder.set(data);
        const liveEntry: OrderLogEntry = {
          archiveId: Date.now(),
          orderId: this.orderId,
          actionType: 'LIVE',
          status: data.status ?? null,
          createdTime: new Date().toISOString(),
          archived: false,
          live: true,
        };
        this.logs.update(prev => [...prev, liveEntry]);
      },
    });
    // Mark as connected after a short delay if socket activates
    setTimeout(() => {
      if (!this.connected()) this.connected.set(true);
    }, 3000);
  }

  close(): void {
    this.dialogRef.close();
  }

  statusColor(status?: string | null): string {
    switch ((status ?? '').toUpperCase()) {
      case 'PLACED':           return '#38BDF8';
      case 'ACCEPTED':         return '#67E8F9';
      case 'PREPARING':        return '#FCD34D';
      case 'READY':
      case 'READY_FOR_PICKUP': return '#C4B5FD';
      case 'PICKED_UP':        return '#93C5FD';
      case 'OUT_FOR_DELIVERY': return '#A5B4FC';
      case 'DELIVERED':        return '#6EE7B7';
      case 'COMPLETED':        return '#86EFAC';
      case 'CANCELLED':        return '#FCA5A5';
      // legacy
      case 'PENDING':          return '#FCD34D';
      case 'IN_PROGRESS':      return '#93C5FD';
      case 'ON_THE_WAY':       return '#A5B4FC';
      default:                 return '#A5B4FC';
    }
  }

  actionLabel(log: OrderLogEntry, index: number): string {
    if (log.live) return 'Live update';
    switch (log.actionType) {
      case 'CREATE': return 'Order placed';
      case 'EDIT': {
        if (log.partnerId) return 'Delivery partner assigned';
        const prev = this.logs()[index - 1];
        if (prev && prev.status !== log.status) return 'Status updated';
        return 'Order updated';
      }
      case 'DELETE': return 'Order deleted';
      default: return log.actionType ?? 'Event';
    }
  }

  statusLabel(status?: string | null): string {
    switch ((status ?? '').toUpperCase()) {
      case 'PLACED':           return 'Placed';
      case 'ACCEPTED':         return 'Accepted';
      case 'PREPARING':        return 'Preparing';
      case 'READY':            return 'Ready';
      case 'READY_FOR_PICKUP': return 'Ready for Pickup';
      case 'PICKED_UP':        return 'Picked Up';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'DELIVERED':        return 'Delivered';
      case 'COMPLETED':        return 'Completed';
      case 'CANCELLED':        return 'Cancelled';
      // legacy
      case 'PENDING':          return 'Pending';
      case 'IN_PROGRESS':      return 'In Progress';
      case 'ON_THE_WAY':       return 'On the Way';
      default:                 return status ?? '—';
    }
  }
}
