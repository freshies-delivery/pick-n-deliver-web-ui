import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { UserContextService } from '../../core/services/user-context.service';
import {
  UserActivityService,
  UserActivityEvent,
  UserActivityStats,
} from './services/user-activity.service';

@Component({
  selector: 'app-user-activity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, StatsStripComponent, SkeletonListComponent, DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './user-activity.component.html',
  styleUrl: './user-activity.component.scss',
})
export class UserActivityComponent implements OnInit {
  readonly userId    = signal(0);
  readonly loading   = signal(true);
  readonly activities= signal<UserActivityEvent[]>([]);
  readonly stats     = signal<UserActivityStats | null>(null);
  readonly dateRange = signal<'7d' | '30d' | '90d' | 'all'>('30d');
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly statsStrip = computed((): StripStat[] => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        value: s.totalSessions,
        label: 'Total Sessions',
        iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
        iconBg: 'rgba(99,102,241,0.15)',
        iconColor: '#A5B4FC',
      },
      {
        value: s.ordersThisMonth,
        label: 'Orders This Month',
        iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2',
        iconBg: 'rgba(59,130,246,0.15)',
        iconColor: '#93C5FD',
        valueColor: '#93C5FD',
      },
      {
        value: s.reviewsGiven,
        label: 'Reviews Given',
        iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z',
        iconBg: 'rgba(245,158,11,0.15)',
        iconColor: '#FCD34D',
        valueColor: '#FCD34D',
      },
      {
        value: s.supportTickets,
        label: 'Support Tickets',
        iconPath: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
        iconBg: 'rgba(236,72,153,0.15)',
        iconColor: '#F9A8D4',
      },
    ];
  });

  readonly groupedActivities = computed(() => {
    const groups = new Map<string, UserActivityEvent[]>();
    for (const event of this.activities()) {
      const key = this.formatDateGroup(event.timestamp);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return groups;
  });

  readonly groupKeys = computed(() => Array.from(this.groupedActivities().keys()));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService,
    private readonly activityService: UserActivityService,
  ) {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);

    effect(() => {
      const range = this.dateRange();
      this.loadActivity(range);
    });
  }

  ngOnInit(): void {
    this.activityService.getStats(this.userId()).subscribe(s => this.stats.set(s));
  }

  private loadActivity(range: '7d' | '30d' | '90d' | 'all'): void {
    this.loading.set(true);
    this.activityService
      .getActivity(this.userId(), range)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(a => this.activities.set(a));
  }

  eventsForGroup(key: string): UserActivityEvent[] {
    return this.groupedActivities().get(key) ?? [];
  }

  activityColor(event: UserActivityEvent): string {
    return this.activityService.getColor(event.type);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  private formatDateGroup(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
