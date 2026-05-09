import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DialogFieldConfig, GenericFormDialogComponent } from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { RichListItemComponent } from '../../shared/components/rich-list-item/rich-list-item.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { OutletDto, OutletService } from './services/outlet.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';

@Component({
  selector: 'app-outlet-list',
  standalone: true,
  imports: [
    PageHeaderComponent, RichListItemComponent, StatsStripComponent,
    PageToolbarComponent, SkeletonListComponent, EmptyStateComponent, PaginationComponent
  ],
  templateUrl: './outlet-list.component.html',
  styleUrl: './outlet-list.component.scss'
})
export class OutletListComponent implements OnInit, OnDestroy {
  readonly clientId = signal(0);
  readonly loading = signal(false);
  readonly outlets = signal<OutletDto[]>([]);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly filteredOutlets = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.outlets().filter((o) => !q || (o.name?.toLowerCase().includes(q) ?? false) || (o.type?.toLowerCase().includes(q) ?? false));
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

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'isVeg', label: 'Vegetarian', type: 'checkbox' },
    { key: 'isPickupAvailable', label: 'Pickup Available', type: 'checkbox' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly outletService: OutletService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
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
    this.outletService.list(this.clientId()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (outlets) => this.outlets.set(outlets),
      error: () => this.snackBar.open('Unable to load outlets', 'Close', { duration: 3000 })
    });
  }

  openCreateDialog(): void {
    this.dialog.open(GenericFormDialogComponent<OutletDto>, { data: { title: 'Add Outlet', fields: this.fields } })
      .afterClosed().subscribe((value: Partial<OutletDto> | undefined) => {
        if (!value) return;
        this.outletService.create({ ...value, clientId: this.clientId() } as OutletDto).subscribe({
          next: () => { this.snackBar.open('Outlet created', 'Close', { duration: 2500 }); this.loadOutlets(); },
          error: () => this.snackBar.open('Failed to create outlet', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(outlet: OutletDto): void {
    this.dialog.open(GenericFormDialogComponent<OutletDto>, { data: { title: `Edit ${outlet.name}`, fields: this.fields, initialValue: outlet } })
      .afterClosed().subscribe((value: Partial<OutletDto> | undefined) => {
        if (!value || !outlet.outletId) return;
        this.outletService.update(outlet.outletId, { ...outlet, ...value, clientId: this.clientId() }).subscribe({
          next: () => { this.snackBar.open('Outlet updated', 'Close', { duration: 2500 }); this.loadOutlets(); },
          error: () => this.snackBar.open('Failed to update outlet', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(outlet: OutletDto): void {
    if (!outlet.outletId) return;
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Outlet', message: `Delete ${outlet.name}?` } })
      .afterClosed().subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.outletService.delete(outlet.outletId!).subscribe({
          next: () => { this.snackBar.open('Outlet deleted', 'Close', { duration: 2500 }); this.loadOutlets(); },
          error: () => this.snackBar.open('Failed to delete outlet', 'Close', { duration: 3000 })
        });
      });
  }

  openDetails(outlet: OutletDto): void {
    if (!outlet.outletId) return;
    this.hierarchyState.setOutlet(outlet.outletId, outlet.name ?? null);
    this.router.navigate(['/dashboard/clients', this.clientId(), 'outlets', outlet.outletId]);
  }
}
