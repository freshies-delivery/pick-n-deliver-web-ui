import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { HierarchyStateService } from '../../../core/services/hierarchy-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly hierarchyState = inject(HierarchyStateService);

  readonly hierarchy = toSignal(this.hierarchyState.hierarchy$, {
    initialValue: this.hierarchyState.state
  });

  readonly expanded = signal({
    clientView: true,
    outletList: true,
    outletDetails: true,
    userView: false,
    adminPanel: false
  });

  readonly summary = computed(() => {
    const state = this.hierarchy();
    const client = state.clientName ?? (state.clientId ? `#${state.clientId}` : 'None');
    const outlet = state.outletName ?? (state.outletId ? `#${state.outletId}` : 'None');
    const category = state.categoryName ?? (state.categoryId ? `#${state.categoryId}` : 'None');
    return `Client: ${client}  |  Outlet: ${outlet}  |  Category: ${category}`;
  });

  readonly hasClient = computed(() => !!this.hierarchy().clientId);
  readonly hasOutlet = computed(() => !!this.hierarchy().outletId);
  readonly hasCategory = computed(() => !!this.hierarchy().categoryId);

  toggle(section: keyof ReturnType<typeof this.expanded>): void {
    this.expanded.update((current) => ({ ...current, [section]: !current[section] }));
  }

  navigateClientRoot(): void {
    this.router.navigate(['/client']);
  }

  navigateOutletList(): void {
    const { clientId } = this.hierarchy();
    if (!clientId) {
      return;
    }
    this.router.navigate(['/client', clientId, 'outlets']);
  }

  navigateOutletDetails(): void {
    const { clientId, outletId } = this.hierarchy();
    if (!clientId || !outletId) {
      return;
    }
    this.router.navigate(['/client', clientId, 'outlets', outletId]);
  }

  navigateCategories(): void {
    const { clientId, outletId } = this.hierarchy();
    if (!clientId || !outletId) {
      return;
    }
    this.router.navigate(['/client', clientId, 'outlets', outletId, 'categories']);
  }

  navigateItems(): void {
    const { clientId, outletId, categoryId } = this.hierarchy();
    if (!clientId || !outletId || !categoryId) {
      return;
    }
    this.router.navigate(['/client', clientId, 'outlets', outletId, 'categories', categoryId, 'items']);
  }

  navigateRatings(): void {
    const { clientId, outletId } = this.hierarchy();
    if (!clientId || !outletId) {
      return;
    }
    this.router.navigate(['/client', clientId, 'outlets', outletId]);
  }

  isRouteActive(prefix: string): boolean {
    return this.router.url.startsWith(prefix);
  }
}

