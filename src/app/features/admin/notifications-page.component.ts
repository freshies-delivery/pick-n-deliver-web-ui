import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationEntry, NotificationService } from './notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly notifications = signal<NotificationEntry[]>([]);

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.list().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  channelIcon(channel: string): string {
    const map: Record<string, string> = { push: 'notifications', sms: 'sms', email: 'email' };
    return map[channel] ?? 'notifications';
  }
}
