import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { finalize } from 'rxjs';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { OutletOrderService, OutletOrderDto } from './services/outlet-order.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-outlet-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, SkeletonListComponent, EmptyStateComponent],
  templateUrl: './outlet-orders.component.html',
  styleUrl: './outlet-orders.component.scss',
})
export class OutletOrdersComponent implements OnChanges {
  @Input({ required: true }) outletId!: number;
  @Input() outletName = '';

  private readonly orderService  = inject(OutletOrderService);
  private readonly modalService  = inject(ModalService);
  private readonly toastService  = inject(ToastService);

  readonly loading      = signal(true);
  readonly orders       = signal<OutletOrderDto[]>([]);
  readonly statusFilter  = signal<string>('all');
  readonly segmentFilter = signal<string>('all');
  readonly expandedId    = signal<number | null>(null);

  readonly palette = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6'];

  readonly segmentChips = computed(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const order of this.orders()) {
      const key   = order.segmentId != null ? String(order.segmentId) : '__none__';
      const label = order.segmentName ?? 'Unassigned';
      if (!map.has(key)) map.set(key, { key, label, count: 0 });
      map.get(key)!.count++;
    }
    const sorted = [...map.values()].sort((a, b) => {
      if (a.key === '__none__') return 1;
      if (b.key === '__none__') return -1;
      return a.label.localeCompare(b.label);
    });
    return sorted.map((s, i) => ({
      ...s,
      color: s.key === '__none__' ? '#6B7280' : this.palette[i % this.palette.length],
    }));
  });

  readonly filteredOrders = computed(() => {
    const f   = this.statusFilter();
    const seg = this.segmentFilter();
    return this.orders().filter(o => {
      const matchesStatus  = f === 'all' || (o.status ?? '').toUpperCase() === f;
      const matchesSegment = seg === 'all' ||
        (seg === '__none__' ? o.segmentId == null : String(o.segmentId) === seg);
      return matchesStatus && matchesSegment;
    });
  });

  readonly stats = computed(() => {
    const all = this.orders();
    const total    = all.length;
    const active   = all.filter(o => ['PLACED','ACCEPTED','PREPARING','READY','READY_FOR_PICKUP','PICKED_UP','OUT_FOR_DELIVERY'].includes((o.status ?? '').toUpperCase())).length;
    const revenue  = all.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const avgOrder = total > 0 ? revenue / total : 0;
    return { total, active, revenue, avgOrder };
  });

  readonly statusCounts = computed(() => {
    const m: Record<string, number> = { all: this.orders().length };
    for (const o of this.orders()) {
      const s = (o.status ?? 'UNKNOWN').toUpperCase();
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  });

  readonly filterTabs = [
    { key: 'all',              label: 'All' },
    { key: 'PLACED',           label: 'Placed' },
    { key: 'ACCEPTED',         label: 'Accepted' },
    { key: 'PREPARING',        label: 'Preparing' },
    { key: 'READY',            label: 'Ready' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { key: 'PICKED_UP',        label: 'Picked Up' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED',        label: 'Delivered' },
    { key: 'COMPLETED',        label: 'Completed' },
    { key: 'CANCELLED',        label: 'Cancelled' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outletId'] && this.outletId) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.listByOutlet(this.outletId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: list => this.orders.set(list),
        error: () => this.toastService.error('Failed to load orders'),
      });
  }

  openCreate(): void {
    this.modalService.openAddOrder(this.outletId, this.outletName)
      .subscribe(result => {
        if (!result) return;
        this.orderService.create(result as OutletOrderDto).subscribe({
          next: created => {
            this.orders.update(list => [created, ...list]);
            this.toastService.success('Order created');
          },
          error: () => this.toastService.error('Failed to create order'),
        });
      });
  }

  toggleExpand(id: number | undefined): void {
    if (!id) return;
    this.expandedId.update(cur => cur === id ? null : id);
  }

  updateStatus(order: OutletOrderDto, status: string): void {
    if (!order.orderId) return;
    this.orderService.update(order.orderId, { ...order, status }).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.orderId === updated.orderId ? updated : o));
        this.toastService.success('Status updated');
      },
      error: () => this.toastService.error('Failed to update status'),
    });
  }

  viewOrder(orderId: number | undefined): void {
    if (!orderId) return;
    this.modalService.openViewOrder(orderId).subscribe();
  }

  trackOrder(orderId: number | undefined): void {
    if (!orderId) return;
    this.modalService.openOrderTracking(orderId).subscribe();
  }

  isActive(status?: string): boolean {
    const s = (status ?? '').toUpperCase();
    return ['PLACED','ACCEPTED','PREPARING','READY','READY_FOR_PICKUP','PICKED_UP','OUT_FOR_DELIVERY'].includes(s);
  }

  confirmDelete(order: OutletOrderDto): void {
    if (!order.orderId) return;
    this.modalService.openConfirm({ title: 'Delete Order', message: `Delete Order #${order.orderId}? This cannot be undone.` })
      .subscribe(ok => {
        if (!ok) return;
        this.orderService.delete(order.orderId!).subscribe({
          next: () => {
            this.orders.update(list => list.filter(o => o.orderId !== order.orderId));
            this.toastService.success('Order deleted');
          },
          error: () => this.toastService.error('Failed to delete order'),
        });
      });
  }

  accentColor(status?: string): string {
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

  itemsSummary(order: OutletOrderDto): string {
    const items = order.orderItems ?? [];
    if (items.length === 0) return 'No items';
    const first = items[0]?.itemName ?? 'Item';
    return items.length === 1 ? first : `${first} + ${items.length - 1} more`;
  }

  formatAmount(v?: number | null): string {
    if (v == null) return '—';
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  nextStatuses(current?: string): { label: string; value: string }[] {
    switch ((current ?? '').toUpperCase()) {
      case 'PLACED':           return [{ label: 'Accept Order',          value: 'ACCEPTED' },       { label: 'Cancel', value: 'CANCELLED' }];
      case 'ACCEPTED':         return [{ label: 'Start Preparing',       value: 'PREPARING' },      { label: 'Cancel', value: 'CANCELLED' }];
      case 'PREPARING':        return [
        { label: 'Mark Ready (Delivery)',  value: 'READY' },
        { label: 'Ready for Pickup',       value: 'READY_FOR_PICKUP' },
        { label: 'Cancel',                 value: 'CANCELLED' },
      ];
      case 'READY':            return [{ label: 'Rider Picked Up',       value: 'PICKED_UP' },      { label: 'Cancel', value: 'CANCELLED' }];
      case 'READY_FOR_PICKUP': return [{ label: 'Mark Completed',        value: 'COMPLETED' },      { label: 'Cancel', value: 'CANCELLED' }];
      case 'PICKED_UP':        return [{ label: 'Out for Delivery',      value: 'OUT_FOR_DELIVERY' },{ label: 'Cancel', value: 'CANCELLED' }];
      case 'OUT_FOR_DELIVERY': return [{ label: 'Mark Delivered',        value: 'DELIVERED' },      { label: 'Cancel', value: 'CANCELLED' }];
      default:                 return [];
    }
  }
}
