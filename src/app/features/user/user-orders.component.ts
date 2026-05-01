import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { UserContextService } from '../../core/services/user-context.service';
import { OrderDto, OrderService } from './services/order.service';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss'
})
export class UserOrdersComponent implements OnInit {
  readonly userId = signal(0);
  readonly loading = signal(false);
  readonly orders = signal<OrderDto[]>([]);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly columns: ColumnConfig[] = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'status', label: 'Status' },
    { key: 'totalAmount', label: 'Amount', type: 'currency' },
    { key: 'type', label: 'Type' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly orderService: OrderService,
    private readonly snackBar: MatSnackBar
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
        next: (orders) => this.orders.set(orders),
        error: () => this.snackBar.open('Unable to load orders', 'Close', { duration: 3000 })
      });
  }
}
