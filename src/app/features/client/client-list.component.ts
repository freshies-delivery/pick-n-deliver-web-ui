import {
  Component, OnDestroy, OnInit,
  ChangeDetectionStrategy,
  WritableSignal, computed, signal, inject
} from '@angular/core';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { DecimalPipe } from '@angular/common';
import { forkJoin, finalize } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ClientDto, ClientService } from './services/client.service';
import { OutletDto, OutletService } from './services/outlet.service';
import { Segment, SegmentService } from '../admin/segment.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { getCategoryColor, getInitials } from '../../shared/constants/category-colors.constant';

/** Segment extended with optional client IDs (if the API supports it) */
interface SegmentWithClients extends Segment {
  clientIds?: number[];
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent, StatsStripComponent,
    SkeletonListComponent, EmptyStateComponent,
    StatusBadgeComponent, DecimalPipe
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
  readonly clients = signal<ClientDto[]>([]);
  readonly segments = signal<SegmentWithClients[]>([]);
  readonly activeSegmentId = signal<string>('all');
  readonly expandedClients = signal<Set<number>>(new Set());
  readonly searchQuery = signal('');
  readonly allExpanded = signal(false);

  private readonly outletsCache = new Map<number, WritableSignal<OutletDto[]>>();
  private readonly loadingOutlets = new Map<number, WritableSignal<boolean>>();

  readonly filteredClients = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const sid = this.activeSegmentId();
    let list  = this.clients();

    if (sid !== 'all' && sid !== 'unassigned') {
      const seg = this.segments().find(s => s.id === sid);
      if (seg?.clientIds?.length) {
        list = list.filter(c => seg.clientIds!.includes(c.clientId!));
      } else {
        list = [];
      }
    }
    if (sid === 'unassigned') {
      const assigned = new Set(
        this.segments().flatMap(s => s.clientIds ?? [])
      );
      list = list.filter(c => !assigned.has(c.clientId!));
    }
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
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
    return this.clients().filter(c => !assigned.has(c.clientId!)).length;
  });

  readonly statsStrip = computed((): StripStat[] => {
    const total      = this.clients().length;
    const unassigned = this.unassignedCount();
    const assigned   = total - unassigned;
    return [
      { value: total,                    label: 'Total Clients', iconPath: 'M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z',                              iconBg: 'rgba(99,102,241,0.15)',  iconColor: '#818CF8' },
      { value: assigned,                 label: 'Assigned',      iconPath: 'M13 4L6 11 3 8',                                                              iconBg: 'rgba(34,197,94,0.12)',   iconColor: '#86EFAC', valueColor: '#86EFAC' },
      { value: this.segments().length,   label: 'Segments',      iconPath: 'M6 2H2v4h4V2zM14 2h-4v4h4V2zM6 10H2v4h4v-4zM14 10h-4v4h4v-4z',              iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#FCD34D', valueColor: '#FCD34D' },
      { value: unassigned,               label: 'Unassigned',    iconPath: 'M12 9v3m0 0v3m0-3h3m-3 0H9m3-9a9 9 0 110 18A9 9 0 0112 3z',                 iconBg: 'rgba(244,63,94,0.12)',   iconColor: '#FCA5A5', valueColor: '#FCA5A5' },
    ];
  });

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Client', icon: 'add', type: 'primary', action: () => this.openCreateDialog() }
  ];

  private readonly modalService  = inject(ModalService);
  private readonly toastService  = inject(ToastService);

  constructor(
    private readonly clientService: ClientService,
    private readonly outletService: OutletService,
    private readonly segmentService: SegmentService,
    private readonly router: Router,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.fabActionService.registerAction('createClient', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());
    this.load();
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createClient');
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      clients:  this.clientService.list(),
      segments: this.segmentService.list()
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ clients, segments }) => {
        this.clients.set(clients);
        this.segments.set(segments as SegmentWithClients[]);
      },
      error: () => this.toastService.error('Unable to load data')
    });
  }

  selectSegment(segId: string): void {
    this.activeSegmentId.set(segId);
    this.expandedClients.set(new Set());
    this.allExpanded.set(false);
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
    const outletsSig  = signal<OutletDto[]>([]);
    const loadingSig  = signal(true);
    this.outletsCache.set(clientId, outletsSig);
    this.loadingOutlets.set(clientId, loadingSig);
    this.outletService.list(clientId).pipe(finalize(() => loadingSig.set(false))).subscribe({
      next: outlets => outletsSig.set(outlets)
    });
  }

  isExpanded(clientId: number): boolean {
    return this.expandedClients().has(clientId);
  }

  getOutlets(clientId: number): OutletDto[] {
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
    this.modalService.openAddClient().subscribe(value => {
      if (!value) return;
      this.clientService.create(value as ClientDto).subscribe({
        next: () => { this.toastService.success('Client created'); this.load(); },
        error: () => this.toastService.error('Failed to create client')
      });
    });
  }

  openEditDialog(client: ClientDto, event: Event): void {
    event.stopPropagation();
    this.modalService.openEditClient(client).subscribe(value => {
      if (!value || !client.clientId) return;
      this.clientService.update(client.clientId, { ...client, ...value }).subscribe({
        next: () => { this.toastService.success('Client updated'); this.load(); },
        error: () => this.toastService.error('Failed to update client')
      });
    });
  }

  confirmDelete(client: ClientDto, event: Event): void {
    event.stopPropagation();
    if (!client.clientId) return;
    this.modalService.openConfirm({ title: 'Delete Client', message: `Delete ${client.name}?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.clientService.delete(client.clientId!).subscribe({
          next: () => { this.toastService.success('Client deleted'); this.load(); },
          error: () => this.toastService.error('Failed to delete client')
        });
      });
  }

  goToOutlet(client: ClientDto, outlet: OutletDto, event?: Event): void {
    event?.stopPropagation();
    if (!outlet.outletId || !client.clientId) return;
    this.hierarchyState.setClient(client.clientId, client.name);
    this.hierarchyState.setOutlet(outlet.outletId, outlet.name);
    this.router.navigate(['/dashboard/clients', client.clientId, 'outlets', outlet.outletId]);
  }

  openAddOutlet(client: ClientDto, event: Event): void {
    event.stopPropagation();
    if (!client.clientId) return;
    this.modalService.openAddOutlet(client.clientId, client.name).subscribe(value => {
      if (!value || !client.clientId) return;
      this.outletService.create({ ...value, clientId: client.clientId } as OutletDto).subscribe({
        next: () => {
          this.toastService.success('Outlet created');
          this.outletsCache.delete(client.clientId!);
          this.loadOutletsForClient(client.clientId!);
        },
        error: () => this.toastService.error('Failed to create outlet')
      });
    });
  }

  confirmDeleteOutlet(outlet: OutletDto, event: Event): void {
    event.stopPropagation();
    if (!outlet.outletId) return;
    this.modalService.openConfirm({ title: 'Delete Outlet', message: `Delete ${outlet.name}?` })
      .subscribe(confirmed => {
        if (!confirmed || !outlet.outletId || !outlet.clientId) return;
        this.outletService.delete(outlet.outletId).subscribe({
          next: () => {
            this.toastService.success('Outlet deleted');
            this.outletsCache.delete(outlet.clientId!);
            this.loadOutletsForClient(outlet.clientId!);
          },
          error: () => this.toastService.error('Failed to delete outlet')
        });
      });
  }

  readonly shimmerRows = [1, 2, 3];
}
