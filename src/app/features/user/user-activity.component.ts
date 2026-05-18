import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';

Chart.register(...registerables);

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
  imports: [PageHeaderComponent, StatsStripComponent, SkeletonListComponent, RouterLink, RouterLinkActive, BaseChartDirective],
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
        value: (s as any).totalEvents ?? (s as any).totalSessions ?? 0,
        label: 'Total Events',
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
        value: s.totalAddresses ?? (s as any).supportTickets ?? 0,
        label: 'Saved Addresses',
        iconPath: 'M10 2C6.686 2 4 4.686 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zM10 10.5A2.5 2.5 0 1 1 10 5a2.5 2.5 0 0 1 0 5.5z',
        iconBg: 'rgba(236,72,153,0.15)',
        iconColor: '#F9A8D4',
      },
    ];
  });

  readonly viewMode = signal<'timeline' | 'chart'>('timeline');

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

  readonly barChartData = computed((): ChartData<'bar'> => {
    const buckets = new Map<string, number>();
    for (const event of this.activities()) {
      const label = event.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    const labels = Array.from(buckets.keys()).reverse();
    const data   = labels.map(l => buckets.get(l) ?? 0);
    return {
      labels,
      datasets: [{
        label: 'Events',
        data,
        backgroundColor: 'rgba(99,102,241,0.5)',
        borderColor: '#6366F1',
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  });

  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} event${ctx.parsed.y !== 1 ? 's' : ''}` } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6B7280', font: { size: 11 }, stepSize: 1 }, beginAtZero: true }
    }
  };

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
