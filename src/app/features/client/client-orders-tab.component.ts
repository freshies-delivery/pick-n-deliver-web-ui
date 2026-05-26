import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { AppDashService } from '../../core/services/app-dash.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { AppDashOrderRowDto } from '../../core/models/app-dash.models';
import { OutletOrderService } from './services/outlet-order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-client-orders-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, PageToolbarComponent,
    SkeletonListComponent, EmptyStateComponent, PaginationComponent,
    RouterLink, RouterLinkActive, DecimalPipe, DatePipe,
  ],
  templateUrl: './client-orders-tab.component.html',
  styleUrl: './client-orders-tab.component.scss',
})
export class ClientOrdersTabComponent implements OnInit {
  readonly clientId    = signal(0);
  readonly loading     = signal(true);
  readonly orders      = signal<AppDashOrderRowDto[]>([]);
  readonly total       = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize    = 20;
  readonly statusFilter = signal<string>('');
  readonly clientName   = signal('');

  readonly filterOptions = computed((): FilterOption[] => [
    { value: '',                label: 'All'              },
    { value: 'PLACED',          label: 'Placed'           },
    { value: 'ACCEPTED',        label: 'Accepted'         },
    { value: 'PREPARING',       label: 'Preparing'        },
    { value: 'READY',           label: 'Ready'            },
    { value: 'READY_FOR_PICKUP',label: 'Ready for Pickup' },
    { value: 'PICKED_UP',       label: 'Picked Up'        },
    { value: 'OUT_FOR_DELIVERY',label: 'Out for Delivery' },
    { value: 'DELIVERED',       label: 'Delivered'        },
    { value: 'COMPLETED',       label: 'Completed'        },
    { value: 'CANCELLED',       label: 'Cancelled'        },
  ]);

  private readonly dashService  = inject(AppDashService);
  private readonly hierService  = inject(HierarchyStateService);
  private readonly route        = inject(ActivatedRoute);
  private readonly destroyRef   = inject(DestroyRef);
  private readonly orderService = inject(OutletOrderService);
  private readonly toastService = inject(ToastService);

  readonly STATUS_OPTIONS = [
    { value: 'PLACED',           label: 'Placed'            },
    { value: 'ACCEPTED',         label: 'Accepted'          },
    { value: 'PREPARING',        label: 'Preparing'         },
    { value: 'READY',            label: 'Ready'             },
    { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup'  },
    { value: 'PICKED_UP',        label: 'Picked Up'         },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery'  },
    { value: 'DELIVERED',        label: 'Delivered'         },
    { value: 'COMPLETED',        label: 'Completed'         },
    { value: 'CANCELLED',        label: 'Cancelled'         },
  ];

  private readonly STATUS_CODE_MAP: Record<number, string> = {
    0: 'PLACED',
    1: 'ACCEPTED',
    2: 'PREPARING',
    3: 'READY',
    4: 'PICKED_UP',
    5: 'OUT_FOR_DELIVERY',
    6: 'DELIVERED',
    7: 'CANCELLED',
  };

  currentStatus(code: number): string {
    return this.STATUS_CODE_MAP[code] ?? 'PLACED';
  }

  updateStatus(order: AppDashOrderRowDto, newStatus: string): void {
    this.orderService.update(order.orderId, { status: newStatus }).subscribe({
      next: () => this.toastService.success('Status updated'),
      error: () => this.toastService.error('Failed to update status'),
    });
  }

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('clientId'));
    this.clientId.set(id);
    this.clientName.set(this.hierService.state.clientName ?? 'Client');
  }

  ngOnInit(): void { this.load(); }

  load(page = 0): void {
    this.loading.set(true);
    const status = this.statusFilter() || undefined;
    this.dashService.getClientOrders(this.clientId(), page, this.pageSize, status)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.orders.set(res.content ?? []);
          this.total.set(res.total ?? res.totalElements ?? 0);
          this.currentPage.set(page);
        },
      });
  }

  onFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.load(0);
  }

  onPageChange(page: number): void { this.load(page - 1); }

  statusLabel(code: number): string {
    return ['Placed', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'][code] ?? 'Unknown';
  }

  statusClass(code: number): string {
    return ['status-placed', 'status-accepted', 'status-preparing', 'status-ready', 'status-picked-up', 'status-out-for-delivery', 'status-delivered', 'status-cancelled'][code] ?? '';
  }

  protected readonly Math = Math;
}
