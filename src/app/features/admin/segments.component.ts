import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { AppDashService } from '../../core/services/app-dash.service';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

interface SegNode {
  segmentId:   number;
  name:        string;
  description: string;
  segmentUri:  string;
  priority:    number;
  parentId:    number | null;
  clientCount: number;
  outletCount: number;
  children:    SegNode[];
  expanded:    boolean;
  color:       string;
}

@Component({
  selector: 'app-segments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, StatsStripComponent, SkeletonListComponent, EmptyStateComponent],
  templateUrl: './segments.component.html',
  styleUrl: './segments.component.scss',
})
export class SegmentsComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving  = signal(false);
  readonly roots   = signal<SegNode[]>([]);

  readonly draggingId  = signal<number | null>(null);
  readonly dragOverId  = signal<number | null>(null);
  readonly dragOverPos = signal<'before' | 'after'>('after');

  private draggingNode: SegNode | null = null;
  private dragLeaveTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly allNodes = computed(() => {
    const out: SegNode[] = [];
    const visit = (nodes: SegNode[]) => nodes.forEach(n => { out.push(n); visit(n.children); });
    visit(this.roots());
    return out;
  });

  readonly flatNodes = computed((): { node: SegNode; depth: number }[] => {
    const result: { node: SegNode; depth: number }[] = [];
    const visit = (nodes: SegNode[], depth: number) => {
      nodes.forEach(n => {
        result.push({ node: n, depth });
        if (n.expanded && n.children.length > 0) visit(n.children, depth + 1);
      });
    };
    visit(this.roots(), 0);
    return result;
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all = this.allNodes();
    return [
      {
        value: this.roots().length, label: 'Root Segments',
        iconPath: 'M4 6h16M4 12h16M4 18h16',
        iconBg: 'rgba(99,102,241,0.15)', iconColor: '#6366f1',
      },
      {
        value: all.length, label: 'All Segments',
        iconPath: 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
        iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3b82f6',
      },
      {
        value: all.reduce((s, n) => s + n.clientCount, 0), label: 'Total Clients',
        iconPath: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z',
        iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22c55e', valueColor: '#22c55e',
      },
      {
        value: all.reduce((s, n) => s + n.outletCount, 0), label: 'Total Outlets',
        iconPath: 'M2 13V6l6-4 6 4v7M6 13v-3h4v3',
        iconBg: 'rgba(245,158,11,0.15)', iconColor: '#f59e0b',
      },
    ];
  });

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Add Segment', icon: 'add', type: 'primary', action: () => this.openCreate(null) },
  ];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  private readonly dashService  = inject(AppDashService);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.dashService.getSegments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: raw => this.roots.set(this.buildTree(raw ?? [])),
        error: () => this.toastService.error('Failed to load segments'),
      });
  }

  private buildTree(flat: any[]): SegNode[] {
    const map = new Map<number, SegNode>();
    flat.forEach((s, i) => {
      map.set(s.segmentId, {
        segmentId:   s.segmentId,
        name:        s.name        ?? '',
        description: s.description ?? '',
        segmentUri:  s.segmentUri  ?? '',
        priority:    s.priority    ?? 0,
        parentId:    s.parentId    ?? null,
        clientCount: s.clientCount ?? 0,
        outletCount: s.outletCount ?? 0,
        children:    [],
        expanded:    false,
        color:       COLORS[i % COLORS.length],
      });
    });
    const roots: SegNode[] = [];
    map.forEach(n => {
      if (n.parentId === null) {
        roots.push(n);
      } else {
        const p = map.get(n.parentId);
        if (p) p.children.push(n); else roots.push(n);
      }
    });
    const byPriority = (a: SegNode, b: SegNode) => a.priority - b.priority;
    roots.sort(byPriority);
    map.forEach(n => n.children.sort(byPriority));
    return roots;
  }

  toggle(node: SegNode): void {
    this.roots.update(roots => this.mapNode(roots, node.segmentId, n => ({ ...n, expanded: !n.expanded })));
  }

  private mapNode(nodes: SegNode[], id: number, fn: (n: SegNode) => SegNode): SegNode[] {
    return nodes.map(n => {
      if (n.segmentId === id) return fn(n);
      if (n.children.length) return { ...n, children: this.mapNode(n.children, id, fn) };
      return n;
    });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, node: SegNode): void {
    this.draggingNode = node;
    this.draggingId.set(node.segmentId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(node.segmentId));
    }
  }

  onDragOver(event: DragEvent, node: SegNode): void {
    if (this.dragLeaveTimer) { clearTimeout(this.dragLeaveTimer); this.dragLeaveTimer = null; }
    const dn = this.draggingNode;
    if (!dn || dn.segmentId === node.segmentId || dn.parentId !== node.parentId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dragOverId.set(node.segmentId);
    this.dragOverPos.set(event.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  }

  onDragLeave(): void {
    this.dragLeaveTimer = setTimeout(() => this.dragOverId.set(null), 40);
  }

  onDrop(event: DragEvent, target: SegNode): void {
    event.preventDefault();
    if (this.dragLeaveTimer) { clearTimeout(this.dragLeaveTimer); this.dragLeaveTimer = null; }
    const dn = this.draggingNode;
    const pos = this.dragOverPos();
    this.dragOverId.set(null);
    this.draggingId.set(null);
    this.draggingNode = null;
    if (!dn || dn.segmentId === target.segmentId || dn.parentId !== target.parentId) return;

    let toSave: SegNode[] = [];

    if (dn.parentId === null) {
      const list = [...this.roots()];
      this.reorder(list, dn.segmentId, target.segmentId, pos);
      list.forEach((n, i) => (n.priority = i));
      toSave = list;
      this.roots.set(list);
    } else {
      const pid = dn.parentId;
      const newRoots = this.mapChildren(this.roots(), pid, children => {
        this.reorder(children, dn.segmentId, target.segmentId, pos);
        children.forEach((n, i) => (n.priority = i));
        toSave = [...children];
        return children;
      });
      this.roots.set(newRoots);
    }

    this.savePriorities(toSave);
  }

  onDragEnd(): void {
    this.draggingNode = null;
    this.draggingId.set(null);
    this.dragOverId.set(null);
  }

  private reorder(list: SegNode[], fromId: number, toId: number, pos: 'before' | 'after'): void {
    const fi = list.findIndex(n => n.segmentId === fromId);
    const ti = list.findIndex(n => n.segmentId === toId);
    if (fi === -1 || ti === -1) return;
    const [item] = list.splice(fi, 1);
    const at = pos === 'before'
      ? (fi < ti ? ti - 1 : ti)
      : (fi < ti ? ti     : ti + 1);
    list.splice(Math.max(0, at), 0, item);
  }

  private mapChildren(nodes: SegNode[], parentId: number, fn: (c: SegNode[]) => SegNode[]): SegNode[] {
    return nodes.map(n => {
      if (n.segmentId === parentId) return { ...n, children: fn([...n.children]) };
      if (n.children.length) return { ...n, children: this.mapChildren(n.children, parentId, fn) };
      return n;
    });
  }

  private savePriorities(nodes: SegNode[]): void {
    const updates = nodes.map((n, i) => ({ segmentId: n.segmentId, priority: i }));
    this.saving.set(true);
    this.dashService.reorderSegments(updates)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({ error: () => this.toastService.error('Failed to save order') });
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  openCreate(parent: SegNode | null): void {
    this.modalService.openAddSegment().subscribe((value: any) => {
      if (!value) return;
      this.dashService.createSegment({
        name:        value.name,
        description: value.description ?? '',
        segmentUri:  value.segment_uri  ?? '',
        priority:    value.priority     ?? 0,
        parentId:    parent?.segmentId  ?? value.parent_id ?? null,
      }).subscribe({
        next: () => { this.toastService.success('Segment created'); this.load(); },
        error: () => this.toastService.error('Failed to create segment'),
      });
    });
  }

  openEdit(node: SegNode): void {
    const data = {
      segmentId:   node.segmentId,
      name:        node.name,
      description: node.description,
      criteria:    node.segmentUri,
    };
    this.modalService.openEditSegment(data as any).subscribe((value: any) => {
      if (!value) return;
      this.dashService.updateSegment(node.segmentId, {
        name:        value.name        ?? node.name,
        description: value.description ?? node.description,
        segmentUri:  value.segment_uri  ?? node.segmentUri,
        priority:    node.priority,
        parentId:    node.parentId ?? null,
      }).subscribe({
        next: () => { this.toastService.success('Segment updated'); this.load(); },
        error: () => this.toastService.error('Failed to update segment'),
      });
    });
  }

  confirmDelete(node: SegNode): void {
    this.modalService.openConfirm({
      title:   'Delete Segment',
      message: `Delete "${node.name}"? This cannot be undone.`,
    }).subscribe(ok => {
      if (!ok) return;
      this.dashService.deleteSegment(node.segmentId).subscribe({
        next: () => { this.toastService.success('Segment deleted'); this.load(); },
        error: () => this.toastService.error('Failed to delete segment'),
      });
    });
  }
}
