import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HierarchyStateService } from '../../../core/services/hierarchy-state.service';
import { UserContextService } from '../../../core/services/user-context.service';
import { ClientService } from '../../../features/client/services/client.service';
import { NotificationService } from '../../../features/admin/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly hierarchyState = inject(HierarchyStateService);
  private readonly userContext = inject(UserContextService);
  private readonly clientService = inject(ClientService);
  private readonly notificationService = inject(NotificationService);

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

  readonly clientCount = signal(0);
  readonly unreadCount = signal(0);

  readonly hasClient = computed(() => !!this.hierarchy().clientId);
  readonly hasOutlet = computed(() => !!this.hierarchy().outletId);
  readonly hasCategory = computed(() => !!this.hierarchy().categoryId);
  readonly hasUser = computed(() => !!this.user().userId);

  constructor() {
    this.userContext.syncFromRoute(this.router.routerState.snapshot.root);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.userContext.syncFromRoute(this.router.routerState.snapshot.root);
      });

    this.clientService.list().subscribe((clients) => this.clientCount.set(clients.length));
    this.notificationService.list().subscribe((n) =>
      this.unreadCount.set(n.filter((x) => x.status === 'scheduled').length)
    );
  }

  toggle(section: keyof ReturnType<typeof this.expanded>): void {
    this.expanded.update((current) => ({ ...current, [section]: !current[section] }));
  }

  navigateClientRoot(): void { this.router.navigate(['/dashboard/clients']); }

  navigateOutletList(): void {
    const { clientId } = this.hierarchy();
    if (!clientId) return;
    this.router.navigate(['/dashboard/clients', clientId, 'outlets']);
  }

  navigateCategories(): void {
    const { clientId, outletId } = this.hierarchy();
    if (!clientId || !outletId) return;
    this.router.navigate(['/dashboard/clients', clientId, 'outlets', outletId, 'categories']);
  }

  navigateItems(): void {
    const { clientId, outletId, categoryId } = this.hierarchy();
    if (!clientId || !outletId || !categoryId) return;
    this.router.navigate(['/dashboard/clients', clientId, 'outlets', outletId, 'categories', categoryId, 'items']);
  }

  navigateRatings(): void {
    const { clientId, outletId } = this.hierarchy();
    if (!clientId || !outletId) return;
    this.router.navigate(['/dashboard/clients', clientId, 'outlets', outletId, 'ratings']);
  }

  navigateUserList(): void { this.router.navigate(['/dashboard/users']); }

  navigateUserOrders(): void {
    const { userId } = this.user();
    if (!userId) return;
    this.router.navigate(['/dashboard/users', userId, 'orders']);
  }

  navigateUserAddresses(): void {
    const { userId } = this.user();
    if (!userId) return;
    this.router.navigate(['/dashboard/users', userId, 'addresses']);
  }

  navigateUserRatings(): void {
    const { userId } = this.user();
    if (!userId) return;
    this.router.navigate(['/dashboard/users', userId, 'ratings']);
  }

  navigateOverview(): void { this.router.navigate(['/dashboard']); }
  navigateSegments(): void { this.router.navigate(['/dashboard/admin/segments']); }
  navigateConfig(): void { this.router.navigate(['/dashboard/admin/config']); }
  navigateOffers(): void { this.router.navigate(['/dashboard/admin/offers']); }
  navigateNotifications(): void { this.router.navigate(['/dashboard/admin/notifications']); }

  isRouteActive(prefix: string): boolean { return this.router.url.startsWith(prefix); }
  isRouteExact(path: string): boolean { return this.router.url === path || this.router.url === path + '/'; }
}
