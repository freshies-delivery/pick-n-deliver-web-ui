import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HierarchyStateService } from '../../../core/services/hierarchy-state.service';
import { UserContextService } from '../../../core/services/user-context.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly hierarchyState = inject(HierarchyStateService);
  private readonly userContext = inject(UserContextService);

  readonly hierarchy = toSignal(this.hierarchyState.hierarchy$, {
    initialValue: this.hierarchyState.state
  });

  readonly user = toSignal(this.userContext.user$, {
    initialValue: this.userContext.state
  });

  readonly expanded = signal({
    clientView: true,
    outletList: true,
    outletDetails: true,
    userView: true,
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
  readonly hasUser = computed(() => !!this.user().userId);
  readonly userSummary = computed(() => `User: ${this.user().userName ?? (this.user().userId ? `#${this.user().userId}` : 'None')}`);

  constructor() {
    this.userContext.syncFromRoute(this.router.routerState.snapshot.root);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.userContext.syncFromRoute(this.router.routerState.snapshot.root));
  }

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

  navigateUserList(): void {
    this.router.navigate(['/users']);
  }

  navigateUserOrders(): void {
    const { userId } = this.user();
    if (!userId) {
      return;
    }
    this.router.navigate(['/users', userId, 'orders']);
  }

  navigateUserAddresses(): void {
    const { userId } = this.user();
    if (!userId) {
      return;
    }
    this.router.navigate(['/users', userId, 'addresses']);
  }

  navigateUserRatings(): void {
    const { userId } = this.user();
    if (!userId) {
      return;
    }
    this.router.navigate(['/users', userId, 'ratings']);
  }

  isRouteActive(prefix: string): boolean {
    return this.router.url.startsWith(prefix);
  }
}

