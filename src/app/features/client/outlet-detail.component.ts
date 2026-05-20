import { AfterViewInit, Component, ViewChild, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryListComponent } from './category-list.component';
import { OutletRatingsComponent } from './outlet-ratings.component';
import { OutletAddressComponent } from './outlet-address.component';
import { OutletDashboardComponent } from './outlet-dashboard.component';
import { OutletOrdersComponent } from './outlet-orders.component';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { CategoryDto } from './services/category.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-outlet-detail',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CategoryListComponent,
    OutletRatingsComponent,
    OutletAddressComponent,
    OutletDashboardComponent,
    OutletOrdersComponent,
  ],
  templateUrl: './outlet-detail.component.html',
  styleUrl: './outlet-detail.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class OutletDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CategoryListComponent) private readonly categoryListComponent?: CategoryListComponent;

  readonly activeTab = signal<'address' | 'categories' | 'ratings' | 'dashboard' | 'orders'>('dashboard');
  private openCategoryDialogPending = false;

  readonly clientId = signal(0);
  readonly outletId = signal(0);

  readonly tabs = [
    { key: 'dashboard' as const,  label: 'Dashboard' },
    { key: 'categories' as const, label: 'Categories' },
    { key: 'ratings' as const,    label: 'Ratings' },
    { key: 'address' as const,    label: 'Address' },
    { key: 'orders' as const,     label: 'Orders' },
  ];

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Generate Report', icon: 'download', type: 'secondary', action: () => this.openReport() },
    { label: 'Add Category',    icon: 'add',      type: 'primary',   action: () => this.openAddCategoryFromHeader() },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService,
    private readonly modalService: ModalService,
  ) {}

  openReport(): void {
    const outletName = this.hierarchyState.state.outletName ?? `Outlet #${this.outletId()}`;
    this.modalService.openReport({
      type: 'outlet', entityId: this.outletId(), label: outletName,
    }).subscribe();
  }

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.outletId.set(Number(this.route.snapshot.paramMap.get('outletId')));
    this.hierarchyState.syncFromRoute(this.route.snapshot);

    const url = this.router.url.split('?')[0];
    if (url.endsWith('/dashboard')) {
      this.activeTab.set('dashboard');
    } else if (url.endsWith('/ratings')) {
      this.activeTab.set('ratings');
    } else if (url.endsWith('/categories')) {
      this.activeTab.set('categories');
    } else if (url.endsWith('/orders')) {
      this.activeTab.set('orders');
    } else if (url.endsWith('/address')) {
      this.activeTab.set('address');
    } else {
      this.activeTab.set('dashboard');
    }

    this.fabActionService.registerAction('addCategory', () => this.openAddCategoryFromHeader());
    this.fabActionService.setFabAction(() => this.openAddCategoryFromHeader());
  }

  ngAfterViewInit(): void {
    if (!this.openCategoryDialogPending) return;
    this.openCategoryDialogPending = false;
    setTimeout(() => this.categoryListComponent?.openCreateDialog());
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('addCategory');
  }

  setTab(tab: 'address' | 'categories' | 'ratings' | 'dashboard' | 'orders'): void {
    this.activeTab.set(tab);
    const cId = this.clientId();
    const oId = this.outletId();
    if (tab === 'categories') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'categories']);
    } else if (tab === 'ratings') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'ratings']);
    } else if (tab === 'dashboard') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'dashboard']);
    } else if (tab === 'orders') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'orders']);
    } else {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'address']);
    }
  }

  openAddCategoryFromHeader(): void {
    this.activeTab.set('categories');
    if (this.categoryListComponent) {
      setTimeout(() => this.categoryListComponent?.openCreateDialog());
      return;
    }
    this.openCategoryDialogPending = true;
  }

  openCategoryItems(category: CategoryDto): void {
    if (!category.categoryId) return;
    this.hierarchyState.setCategory(category.categoryId, category.name ?? null);
    this.router.navigate([
      '/dashboard/clients', this.clientId(),
      'outlets', this.outletId(),
      'categories', category.categoryId, 'items'
    ]);
  }
}
