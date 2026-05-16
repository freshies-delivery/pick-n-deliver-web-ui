import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { UserContextService } from '../../core/services/user-context.service';
import { OrderDto, OrderService } from './services/order.service';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    StatsStripComponent,
    PageToolbarComponent,
    StatusBadgeComponent,
    SkeletonListComponent,
    EmptyStateComponent,
    DatePipe,
    DecimalPipe,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss',
})
export class UserOrdersComponent implements OnInit {
  readonly userId      = signal(0);
  readonly loading     = signal(false);
  readonly orders      = signal<OrderDto[]>([]);
  readonly searchQuery = signal('');
  readonly statusFilter= signal<string>('all');
  readonly expandedId  = signal<number | null>(null);
  readonly userLabel   = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly filteredOrders = computed(() => {
    const q  = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    return this.orders().filter(o => {
      const matchesStatus = sf === 'all' || (o.status ?? '').toLowerCase() === sf;
      const matchesSearch = !q ||
        String(o.orderId).includes(q) ||
        (o.status ?? '').toLowerCase().includes(q) ||
        (o.type ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all = this.orders();
    const delivered = all.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const cancelled = all.filter(o => o.status?.toLowerCase() === 'cancelled').length;
    const totalSpent = all.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

    return [
      {
        value: all.length,
        label: 'Total Orders',
        iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2',
        iconBg: 'rgba(99,102,241,0.15)',
        iconColor: '#A5B4FC',
      },
      {
        value: delivered,
        label: 'Delivered',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(34,197,94,0.15)',
        iconColor: '#86EFAC',
        valueColor: '#86EFAC',
      },
      {
        value: cancelled,
        label: 'Cancelled',
        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(244,63,94,0.15)',
        iconColor: '#FCA5A5',
        valueColor: '#FCA5A5',
      },
      {
        value: '₹' + totalSpent.toLocaleString('en-IN'),
        label: 'Total Spent',
        iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(245,158,11,0.15)',
        iconColor: '#FCD34D',
        valueColor: '#FCD34D',
      },
    ];
  });

  readonly filterOptions = computed((): FilterOption[] => [
    { value: 'all',       label: 'All',       count: this.orders().length },
    { value: 'delivered', label: 'Delivered',  count: this.orders().filter(o => o.status?.toLowerCase() === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled',  count: this.orders().filter(o => o.status?.toLowerCase() === 'cancelled').length },
    { value: 'pending',   label: 'Pending',    count: this.orders().filter(o => o.status?.toLowerCase() === 'pending').length },
  ]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly orderService: OrderService,
    private readonly snackBar: MatSnackBar,
  ) {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService
      .listForUser(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: orders => this.orders.set(orders),
        error: () => this.snackBar.open('Unable to load orders', 'Close', { duration: 3000 }),
      });
  }

  toggleExpand(orderId: number | undefined): void {
    if (!orderId) return;
    this.expandedId.update(id => id === orderId ? null : orderId);
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '₹0';
    return '₹' + amount.toLocaleString('en-IN');
  }

  accentColor(status?: string): string {
    const map: Record<string, string> = {
      delivered: '#22C55E',
      cancelled: '#F43F5E',
      pending:   '#F59E0B',
      en_route:  '#3B82F6',
    };
    return map[(status ?? '').toLowerCase()] ?? '#6366F1';
  }

  orderInitials(order: OrderDto): string {
    return order.type?.slice(0, 2).toUpperCase() ?? 'OR';
  }
}
