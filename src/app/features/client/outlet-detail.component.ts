import { AfterViewInit, Component, ViewChild, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryListComponent } from './category-list.component';
import { OutletRatingsComponent } from './outlet-ratings.component';
import { OutletAddressComponent } from './outlet-address.component';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { CategoryDto } from './services/category.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';

@Component({
  selector: 'app-outlet-detail',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CategoryListComponent,
    OutletRatingsComponent,
    OutletAddressComponent
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

  readonly activeTab = signal<'address' | 'categories' | 'ratings'>('categories');
  private openCategoryDialogPending = false;

  readonly clientId = signal(0);
  readonly outletId = signal(0);

  readonly tabs = [
    { key: 'address' as const,    label: 'Address' },
    { key: 'categories' as const, label: 'Categories' },
    { key: 'ratings' as const,    label: 'Ratings' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Category', icon: 'add', type: 'primary', action: () => this.openAddCategoryFromHeader() }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.outletId.set(Number(this.route.snapshot.paramMap.get('outletId')));
    this.hierarchyState.syncFromRoute(this.route.snapshot);

    const url = this.router.url;
    if (url.includes('/ratings')) {
      this.activeTab.set('ratings');
    } else if (url.includes('/categories')) {
      this.activeTab.set('categories');
    } else {
      this.activeTab.set('address');
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

  setTab(tab: 'address' | 'categories' | 'ratings'): void {
    this.activeTab.set(tab);
    const cId = this.clientId();
    const oId = this.outletId();
    if (tab === 'categories') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'categories']);
    } else if (tab === 'ratings') {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId, 'ratings']);
    } else {
      this.router.navigate(['/dashboard/clients', cId, 'outlets', oId]);
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
