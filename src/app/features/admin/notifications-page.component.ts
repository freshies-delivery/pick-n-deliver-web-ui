import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { NotificationEntry, NotificationService } from './notification.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    StatsStripComponent,
    PageToolbarComponent,
    RichListItemComponent,
    SkeletonListComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly notifications = signal<NotificationEntry[]>([]);
  readonly activeFilter = signal('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly filteredNotifications = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    return this.notifications().filter(n => {
      const matchesFilter = f === 'all' || n.status === f;
      const matchesSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.channel.toLowerCase().includes(q) ||
        n.targetLabel.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  readonly pagedNotifications = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredNotifications().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all = this.notifications();
    const sent = all.filter(n => n.status === 'sent').length;
    const scheduled = all.filter(n => n.status === 'scheduled').length;
    const avgOpenRate = sent > 0
      ? Math.round(all.filter(n => n.status === 'sent').reduce((acc, n) => acc + n.openRate, 0) / sent)
      : 0;
    return [
      {
        value: all.length,
        label: 'Total',
        iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9',
        iconBg: 'rgba(99,102,241,0.15)',
        iconColor: '#6366f1'
      },
      {
        value: sent,
        label: 'Sent',
        iconPath: 'M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
        iconBg: 'rgba(34,197,94,0.15)',
        iconColor: '#22c55e',
        valueColor: '#22c55e'
      },
      {
        value: scheduled,
        label: 'Scheduled',
        iconPath: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(234,179,8,0.15)',
        iconColor: '#eab308',
        valueColor: '#eab308'
      },
      {
        value: avgOpenRate + '%',
        label: 'Avg Open Rate',
        iconPath: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        iconBg: 'rgba(59,130,246,0.15)',
        iconColor: '#3b82f6',
        valueColor: '#3b82f6'
      }
    ];
  });

  readonly filterOptions = computed((): FilterOption[] => [
    { value: 'all', label: 'All', count: this.notifications().length },
    { value: 'sent', label: 'Sent', count: this.notifications().filter(n => n.status === 'sent').length },
    { value: 'scheduled', label: 'Scheduled', count: this.notifications().filter(n => n.status === 'scheduled').length }
  ]);

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Send Notification', icon: 'add', type: 'primary', action: () => this.openSend() }
  ];

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notificationService.list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (notifications) => this.notifications.set(notifications) });
  }

  openSend(): void {
    this.modalService.openSendNotification().subscribe(value => {
      if (!value) return;
      this.notificationService.send(value).subscribe({
        next: () => { this.toastService.success('Notification sent'); this.load(); },
        error: () => this.toastService.error('Failed to send notification'),
      });
    });
  }

  confirmDelete(notif: NotificationEntry): void {
    this.modalService.openConfirm({ title: 'Delete Notification', message: `Delete "${notif.title}"?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.notificationService.delete(notif.id).subscribe({
          next: () => { this.toastService.success('Notification deleted'); this.load(); },
          error: () => this.toastService.error('Failed to delete notification'),
        });
      });
  }

  notifStats(notif: NotificationEntry): ListStat[] {
    return [
      { value: notif.sentCount, label: 'Sent' },
      { value: notif.openRate + '%', label: 'Open rate' },
      { value: notif.targetLabel, label: 'Target' }
    ];
  }
}
