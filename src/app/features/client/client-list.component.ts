import {
  Component, OnDestroy, OnInit,
  ChangeDetectionStrategy,
  WritableSignal, computed, signal, inject
} from '@angular/core';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { forkJoin, finalize, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Segment } from '../admin/segment.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';
import { LocationService } from '../../core/services/location.service';
import { getCategoryColor, getInitials } from '../../shared/constants/category-colors.constant';

const SEGMENT_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

interface SegmentWithClients extends Segment {
  clientIds?: number[];
  parentId?: string | null;
  priority?: number | null;
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, StatsStripComponent,
    EmptyStateComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('140ms ease', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ]
})
export class ClientListComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly clients = signal<any[]>([]);
  readonly segments = signal<SegmentWithClients[]>([]);
  readonly activeSegmentId = signal<string>('all');
  readonly activeRootId    = signal<string | null>(null);
  readonly expandedClients = signal<Set<number>>(new Set());
  readonly searchQuery = signal('');
  readonly allExpanded = signal(false);

  private readonly outletsCache = new Map<number, WritableSignal<any[]>>();
  private readonly loadingOutlets = new Map<number, WritableSignal<boolean>>();

  readonly filteredClients = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const sid = this.activeSegmentId();
    let list  = this.clients();

    if (sid !== 'all' && sid !== 'unassigned') {
      const seg = this.segments().find(s => s.id === sid);
      // Include clients from children of this segment too (root → children rollup)
      const childIds = this.segments()
        .filter(s => s.parentId === sid)
        .flatMap(s => s.clientIds ?? []);
      const allIds = new Set([...(seg?.clientIds ?? []), ...childIds]);
      list = allIds.size > 0 ? list.filter(c => allIds.has(c.clientId)) : [];
    }
    if (sid === 'unassigned') {
      const assigned = new Set(
        this.segments().flatMap(s => s.clientIds ?? [])
      );
      list = list.filter(c => !assigned.has(c.clientId));
    }
    if (q) {
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  });

  readonly activeSegment = computed(() =>
    this.segments().find(s => s.id === this.activeSegmentId()) ?? null
  );

  readonly unassignedCount = computed(() => {
    const assigned = new Set(
      this.segments().flatMap(s => s.clientIds ?? [])
    );
    return this.clients().filter(c => !assigned.has(c.clientId)).length;
  });

  readonly rootSegments = computed(() =>
    this.segments().filter(s => !s.parentId)
  );

  readonly childSegments = computed(() => {
    const rootId = this.activeRootId();
    if (!rootId) return [];
    return this.segments().filter(s => s.parentId === rootId);
  });

  readonly statsStrip = computed((): StripStat[] => {
    const total      = this.clients().length;
    const unassigned = this.unassignedCount();
    const assigned   = total - unassigned;
    return [
      { value: total,                   label: 'Total Clients', iconPath: 'M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z',                            iconBg: 'rgba(99,102,241,0.15)',  iconColor: '#818CF8' },
      { value: assigned,                label: 'Assigned',      iconPath: 'M13 4L6 11 3 8',                                                            iconBg: 'rgba(34,197,94,0.12)',   iconColor: '#86EFAC', valueColor: '#86EFAC' },
      { value: this.segments().length,  label: 'Segments',      iconPath: 'M6 2H2v4h4V2zM14 2h-4v4h4V2zM6 10H2v4h4v-4zM14 10h-4v4h4v-4z',            iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#FCD34D', valueColor: '#FCD34D' },
      { value: unassigned,              label: 'Unassigned',    iconPath: 'M12 9v3m0 0v3m0-3h3m-3 0H9m3-9a9 9 0 110 18A9 9 0 0112 3z',               iconBg: 'rgba(244,63,94,0.12)',   iconColor: '#FCA5A5', valueColor: '#FCA5A5' },
    ];
  });

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Client', icon: 'add', type: 'primary', action: () => this.openCreateDialog() }
  ];

  private readonly modalService    = inject(ModalService);
  private readonly toastService    = inject(ToastService);
  private readonly dashService     = inject(AppDashService);
  private readonly locationService = inject(LocationService);
  private readonly locationIds$    = toObservable(this.locationService.selectedIds);
  private locationSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.fabActionService.registerAction('createClient', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());

    this.locationSub = this.locationIds$.pipe(
      tap(() => {
        this.loading.set(true);
        this.outletsCache.clear();
        this.loadingOutlets.clear();
        this.expandedClients.set(new Set());
        this.allExpanded.set(false);
      }),
      switchMap(ids => {
        const locIds = ids.length > 0 ? ids : undefined;
        return forkJoin({
          clients:  this.dashService.getClients(0, 200, locIds),
          segments: this.dashService.getSegments()
        });
      })
    ).subscribe({
      next: ({ clients, segments }) => {
        const clientList = Array.isArray(clients) ? clients : (clients?.content ?? []);
        this.clients.set(clientList);

        const rootSegs = (segments ?? []).filter((s: any) => !s.parentId);
        const childSegs = (segments ?? []).filter((s: any) => s.parentId);
        const orderedSegs = [...rootSegs, ...childSegs];
        const segList: SegmentWithClients[] = orderedSegs.map((s: any, i: number) => ({
          id:               String(s.segmentId),
          name:             s.name,
          description:      s.description ?? '',
          criteria:         s.segmentUri ?? '',
          criteriaReadable: `${s.clientCount ?? 0} clients`,
          userCount:        s.clientCount ?? 0,
          isActive:         true,
          createdAt:        new Date(),
          color:            SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          parentId:         s.parentId != null ? String(s.parentId) : null,
          priority:         s.priority ?? null,
          clientIds:        clientList
            .filter((c: any) => c.segmentId === s.segmentId)
            .map((c: any) => c.clientId as number),
        }));
        this.segments.set(segList);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Unable to load data');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createClient');
    this.locationSub?.unsubscribe();
  }

  load(): void {
    const ids = this.locationService.selectedIds();
    const locIds = ids.length > 0 ? ids : undefined;
    this.loading.set(true);
    this.outletsCache.clear();
    this.loadingOutlets.clear();
    forkJoin({
      clients:  this.dashService.getClients(0, 200, locIds),
      segments: this.dashService.getSegments()
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ clients, segments }) => {
        const clientList = Array.isArray(clients) ? clients : (clients?.content ?? []);
        this.clients.set(clientList);

        const rootSegs = (segments ?? []).filter((s: any) => !s.parentId);
        const childSegs = (segments ?? []).filter((s: any) => s.parentId);
        const orderedSegs = [...rootSegs, ...childSegs];
        const segList: SegmentWithClients[] = orderedSegs.map((s: any, i: number) => ({
          id:               String(s.segmentId),
          name:             s.name,
          description:      s.description ?? '',
          criteria:         s.segmentUri ?? '',
          criteriaReadable: `${s.clientCount ?? 0} clients`,
          userCount:        s.clientCount ?? 0,
          isActive:         true,
          createdAt:        new Date(),
          color:            SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          parentId:         s.parentId != null ? String(s.parentId) : null,
          priority:         s.priority ?? null,
          clientIds:        clientList
            .filter((c: any) => c.segmentId === s.segmentId)
            .map((c: any) => c.clientId as number),
        }));
        this.segments.set(segList);
      },
      error: () => this.toastService.error('Unable to load data')
    });
  }

  selectSegment(segId: string): void {
    this.activeSegmentId.set(segId);
    this.expandedClients.set(new Set());
    this.allExpanded.set(false);
    // Track the active root for showing children row
    const seg = this.segments().find(s => s.id === segId);
    if (!seg) {
      // 'all' or 'unassigned' — keep the current root row visible
    } else if (!seg.parentId) {
      // clicked a root segment
      this.activeRootId.set(segId);
    } else {
      // clicked a child — keep its parent root highlighted
      this.activeRootId.set(seg.parentId ?? null);
    }
  }

  toggleClient(clientId: number): void {
    const set = new Set(this.expandedClients());
    if (set.has(clientId)) {
      set.delete(clientId);
    } else {
      set.add(clientId);
      this.loadOutletsForClient(clientId);
    }
    this.expandedClients.set(set);
  }

  private loadOutletsForClient(clientId: number): void {
    if (this.outletsCache.has(clientId)) return;
    const outletsSig  = signal<any[]>([]);
    const loadingSig  = signal(true);
    this.outletsCache.set(clientId, outletsSig);
    this.loadingOutlets.set(clientId, loadingSig);
    const ids = this.locationService.selectedIds();
    const locIds = ids.length > 0 ? ids : undefined;
    this.dashService.getOutlets(clientId, 0, 100, locIds)
      .pipe(finalize(() => loadingSig.set(false)))
      .subscribe({
        next: res => {
          const list = Array.isArray(res) ? res : (res?.content ?? []);
          outletsSig.set(list);
        }
      });
  }

  isExpanded(clientId: number): boolean {
    return this.expandedClients().has(clientId);
  }

  getOutlets(clientId: number): any[] {
    return this.outletsCache.get(clientId)?.() ?? [];
  }

  isLoadingOutlets(clientId: number): boolean {
    return this.loadingOutlets.get(clientId)?.() ?? false;
  }

  toggleAll(): void {
    const next = !this.allExpanded();
    this.allExpanded.set(next);
    if (next) {
      const ids = new Set(this.expandedClients());
      this.filteredClients().forEach(c => {
        if (c.clientId) {
          ids.add(c.clientId);
          this.loadOutletsForClient(c.clientId);
        }
      });
      this.expandedClients.set(ids);
    } else {
      this.expandedClients.set(new Set());
    }
  }

  getClientSegmentName(clientId: number): string {
    const seg = this.segments().find(s => s.clientIds?.includes(clientId));
    return seg?.name ?? 'Unassigned';
  }

  getClientSegmentColor(clientId: number): string {
    const seg = this.segments().find(s => s.clientIds?.includes(clientId));
    return seg?.color ?? '#44446A';
  }

  getCatBg(cat?: string):    string { return getCategoryColor(cat).bg; }
  getCatText(cat?: string):  string { return getCategoryColor(cat).text; }
  getCatBar(cat?: string):   string { return getCategoryColor(cat).bar; }
  getInitials(name: string): string { return getInitials(name); }

  openCreateDialog(): void {
    this.modalService.openAddClient().subscribe((value: any) => {
      if (!value) return;
      const dto = {
        name:        value.name,
        description: value.description ?? '',
        imageUrl:    value.image_url ?? '',
        segmentId:   value.segment_id ?? null,
      };
      this.dashService.createClient(dto).subscribe({
        next: () => { this.toastService.success('Client created'); this.load(); },
        error: () => this.toastService.error('Failed to create client')
      });
    });
  }

  openEditDialog(client: any, event: Event): void {
    event.stopPropagation();
    this.modalService.openEditClient(client).subscribe((value: any) => {
      if (!value || !client.clientId) return;
      const dto = {
        name:        value.name ?? client.name,
        description: value.description ?? client.description ?? '',
        imageUrl:    value.image_url ?? client.imageUrl ?? '',
        segmentId:   value.segment_id ?? client.segmentId ?? null,
      };
      this.dashService.updateClient(client.clientId, dto).subscribe({
        next: () => { this.toastService.success('Client updated'); this.load(); },
        error: () => this.toastService.error('Failed to update client')
      });
    });
  }

  confirmDelete(client: any, event: Event): void {
    event.stopPropagation();
    if (!client.clientId) return;
    this.modalService.openConfirm({ title: 'Delete Client', message: `Delete ${client.name}?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.dashService.deleteClient(client.clientId).subscribe({
          next: () => { this.toastService.success('Client deleted'); this.load(); },
          error: () => this.toastService.error('Failed to delete client')
        });
      });
  }

  goToOutlet(client: any, outlet: any, event?: Event): void {
    event?.stopPropagation();
    if (!outlet.outletId || !client.clientId) return;
    this.hierarchyState.setClient(client.clientId, client.name);
    this.hierarchyState.setOutlet(outlet.outletId, outlet.name);
    this.router.navigate(['/dashboard/clients', client.clientId, 'outlets', outlet.outletId]);
  }

  openAddOutlet(client: any, event: Event): void {
    event.stopPropagation();
    if (!client.clientId) return;
    this.modalService.openAddOutlet(client.clientId, client.name).subscribe((value: any) => {
      if (!value || !client.clientId) return;
      const dto = {
        name:              value.name,
        description:       value.description ?? '',
        type:              value.type ?? '',
        outletUri:         value.outlet_uri ?? '',
        isVeg:             value.is_veg ?? false,
        isPickupAvailable: value.is_pickup_available ?? true,
        imageUrl:          value.image_url ?? '',
        clientId:          client.clientId,
      };
      this.dashService.createOutlet(dto).subscribe({
        next: (created) => {
          const outletId = created?.outletId;
          if (outletId && value.address_line1) {
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
            this.dashService.upsertOutletAddress(outletId, addrDto).subscribe();
          }
          this.toastService.success('Outlet created');
          this.outletsCache.delete(client.clientId);
          this.loadOutletsForClient(client.clientId);
        },
        error: () => this.toastService.error('Failed to create outlet')
      });
    });
  }

  confirmDeleteOutlet(outlet: any, event: Event): void {
    event.stopPropagation();
    if (!outlet.outletId) return;
    this.modalService.openConfirm({ title: 'Delete Outlet', message: `Delete ${outlet.name}?` })
      .subscribe(confirmed => {
        if (!confirmed || !outlet.outletId || !outlet.clientId) return;
        this.dashService.deleteOutlet(outlet.outletId).subscribe({
          next: () => {
            this.toastService.success('Outlet deleted');
            const cid = outlet.clientId;
            this.outletsCache.delete(cid);
            this.loadOutletsForClient(cid);
          },
          error: () => this.toastService.error('Failed to delete outlet')
        });
      });
  }

  readonly shimmerRows = [1, 2, 3];
}
