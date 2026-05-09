import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Offer, OfferService } from './offer.service';

@Component({
  selector: 'app-offers',
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
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss'
})
export class OffersComponent implements OnInit {
  readonly loading = signal(true);
  readonly offers = signal<Offer[]>([]);
  readonly filter = signal<string>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly filteredOffers = computed(() => {
    const f = this.filter();
    const q = this.searchQuery().toLowerCase().trim();
    return this.offers().filter(o => {
      const matchesFilter = f === 'all' || o.status === f;
      const matchesSearch = !q ||
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.applicableCategories.some(c => c.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  });

  readonly pagedOffers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOffers().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all = this.offers();
    const active = all.filter(o => o.status === 'active').length;
    const scheduled = all.filter(o => o.status === 'scheduled').length;
    const expired = all.filter(o => o.status === 'expired').length;
    return [
      {
        value: all.length,
        label: 'Total Offers',
        iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2',
        iconBg: 'rgba(99,102,241,0.15)',
        iconColor: '#6366f1'
      },
      {
        value: active,
        label: 'Active',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
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
        value: expired,
        label: 'Expired',
        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(239,68,68,0.15)',
        iconColor: '#ef4444',
        valueColor: '#ef4444'
      }
    ];
  });

  readonly filterOptions = computed((): FilterOption[] => [
    { value: 'all', label: 'All', count: this.offers().length },
    { value: 'active', label: 'Active', count: this.offers().filter(o => o.status === 'active').length },
    { value: 'scheduled', label: 'Scheduled', count: this.offers().filter(o => o.status === 'scheduled').length },
    { value: 'expired', label: 'Expired', count: this.offers().filter(o => o.status === 'expired').length }
  ]);

  constructor(private readonly offerService: OfferService) {}

  ngOnInit(): void {
    this.offerService.list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offers) => this.offers.set(offers)
      });
  }

  usagePercent(offer: Offer): number {
    if (!offer.usageLimit) return 0;
    return Math.round((offer.usageCount / offer.usageLimit) * 100);
  }

  offerStats(offer: Offer): ListStat[] {
    return [
      { value: offer.usageCount, label: 'Used' },
      { value: offer.usageLimit, label: 'Limit' },
      { value: this.usagePercent(offer) + '%', label: 'Used %' }
    ];
  }

  discountLabel(offer: Offer): string {
    return offer.discountType === 'percentage'
      ? offer.discountValue + '% OFF'
      : '₹' + offer.discountValue + ' OFF';
  }
}
