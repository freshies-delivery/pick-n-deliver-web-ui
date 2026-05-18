import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);
  private readonly notificationService = inject(NotificationService);

  readonly clientCount = signal(0);
  readonly unreadCount = signal(0);

  constructor() {
    this.clientService.list().subscribe((clients) => this.clientCount.set(clients.length));
    this.notificationService.list().subscribe((n) =>
      this.unreadCount.set(n.filter((x) => x.status === 'scheduled').length)
    );
  }

  navigateExplore(): void { this.router.navigate(['/dashboard/clients/explore']); }
  navigateClientList(): void { this.router.navigate(['/dashboard/clients/list']); }

  navigateUserExplore(): void { this.router.navigate(['/dashboard/users/explore']); }
  navigateAllUsers(): void { this.router.navigate(['/dashboard/users/list']); }

  navigateOverview(): void { this.router.navigate(['/dashboard']); }
  navigateSegments(): void { this.router.navigate(['/dashboard/admin/segments']); }
  navigateConfig(): void { this.router.navigate(['/dashboard/admin/config']); }
  navigateOffers(): void { this.router.navigate(['/dashboard/admin/offers']); }
  navigateNotifications(): void { this.router.navigate(['/dashboard/admin/notifications']); }

  isRouteActive(prefix: string): boolean { return this.router.url.startsWith(prefix); }
  isRouteExact(path: string): boolean { return this.router.url === path || this.router.url === path + '/'; }
}
