import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { RichListItemComponent } from '../../shared/components/rich-list-item/rich-list-item.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent } from '../../shared/components/page-toolbar/page-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';

@Component({
  selector: 'app-outlet-list',
  standalone: true,
  imports: [
    PageHeaderComponent, RichListItemComponent, StatsStripComponent,
    PageToolbarComponent, SkeletonListComponent, EmptyStateComponent, PaginationComponent,
    RouterLink, RouterLinkActive,
  ],
  templateUrl: './outlet-list.component.html',
  styleUrl: './outlet-list.component.scss'
})
export class OutletListComponent implements OnInit, OnDestroy {
  readonly clientId    = signal(0);
  readonly loading     = signal(false);
  readonly outlets     = signal<any[]>([]);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize    = 10;

  readonly filteredOutlets = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.outlets().filter(o =>
      !q || (o.name?.toLowerCase().includes(q) ?? false) || (o.type?.toLowerCase().includes(q) ?? false)
    );
  });

  readonly pagedOutlets = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOutlets().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => [
    { value: this.outlets().length, label: 'Total Outlets', iconPath: 'M2 13V6l6-4 6 4v7M6 13v-3h4v3', iconBg: 'rgba(99,102,241,0.15)', iconColor: '#818CF8' },
    { value: this.outlets().length, label: 'Active',        iconPath: 'M13 4L6 11 3 8',                iconBg: 'rgba(34,197,94,0.12)',  iconColor: '#4ADE80' },
    { value: 0,                     label: 'Open Now',      iconPath: 'M8 3v5l3 3',                    iconBg: 'rgba(245,158,11,0.12)', iconColor: '#FCD34D' },
    { value: '—',                   label: 'Avg Rating',    iconPath: 'M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5z', iconBg: 'rgba(168,85,247,0.12)', iconColor: '#C084FC' },
  ]);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Outlet', icon: 'add', type: 'primary', action: () => this.openCreateDialog() }
  ];

  private readonly modalService  = inject(ModalService);
  private readonly toastService  = inject(ToastService);
  private readonly dashService   = inject(AppDashService);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.hierarchyState.syncFromRoute(this.route.snapshot);
    this.fabActionService.registerAction('createOutlet', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());
    this.loadOutlets();
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createOutlet');
  }

  loadOutlets(): void {
    this.loading.set(true);
    this.dashService.getOutlets(this.clientId(), 0, 200)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          const list = Array.isArray(res) ? res : (res?.content ?? []);
          this.outlets.set(list);
        },
        error: () => this.toastService.error('Unable to load outlets')
      });
  }

  openCreateDialog(): void {
    const clientId = this.clientId();
    this.modalService.openAddOutlet(clientId, '').subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:              value.name,
        description:       value.description ?? '',
        type:              value.type ?? '',
        outletUri:         value.outlet_uri ?? '',
        isVeg:             value.is_veg ?? false,
        isPickupAvailable: value.is_pickup_available ?? true,
        imageUrl:          value.image_url ?? '',
        clientId,
      };
      this.dashService.createOutlet(dto).subscribe({
        next: (created) => {
          if (created?.outletId && value.address_line1) {
            const addrDto = {
              doorNo:       value.door_no ?? '',
              buildingName: value.building_name ?? '',
              addressLine1: value.address_line1,
              addressLine2: value.address_line2 ?? '',
              city:         value.city,
              state:        value.state,
              zipCode:      value.zip_code ?? '',
              country:      value.country ?? 'India',
              instructions: value.instructions ?? '',
              latitude:     value.latitude ?? null,
              longitude:    value.longitude ?? null,
            };
            this.dashService.upsertOutletAddress(created.outletId, addrDto).subscribe();
          }
          this.toastService.success('Outlet created');
          this.loadOutlets();
        },
        error: () => this.toastService.error('Failed to create outlet')
      });
    });
  }

  openEditDialog(outlet: any): void {
    this.modalService.openEditOutlet(outlet).subscribe((value: any) => {
      if (!value || !outlet.outletId) return;
      const dto = {
        name:              value.name ?? outlet.name,
        description:       value.description ?? outlet.description ?? '',
        type:              value.type ?? outlet.type ?? '',
        outletUri:         value.outlet_uri ?? outlet.outletUri ?? '',
        isVeg:             value.is_veg ?? outlet.isVeg ?? false,
        isPickupAvailable: value.is_pickup_available ?? outlet.isPickupAvailable ?? true,
        imageUrl:          value.image_url ?? outlet.imageUrl ?? '',
        clientId:          this.clientId(),
      };
      this.dashService.updateOutlet(outlet.outletId, dto).subscribe({
        next: () => { this.toastService.success('Outlet updated'); this.loadOutlets(); },
        error: () => this.toastService.error('Failed to update outlet')
      });
    });
  }

  confirmDelete(outlet: any): void {
    if (!outlet.outletId) return;
    this.modalService.openConfirm({ title: 'Delete Outlet', message: `Delete ${outlet.name}?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.dashService.deleteOutlet(outlet.outletId).subscribe({
          next: () => { this.toastService.success('Outlet deleted'); this.loadOutlets(); },
          error: () => this.toastService.error('Failed to delete outlet')
        });
      });
  }

  openDetails(outlet: any): void {
    if (!outlet.outletId) return;
    this.hierarchyState.setOutlet(outlet.outletId, outlet.name ?? null);
    this.router.navigate(['/dashboard/clients', this.clientId(), 'outlets', outlet.outletId]);
  }
}
