import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Offer, OfferType, OfferPayload, OfferService } from './offer.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

const TYPE_LABELS: Record<OfferType, string> = {
  PERCENTAGE:    'Percentage',
  FLAT:          'Flat',
  FREE_DELIVERY: 'Free Delivery',
  BUY_X_GET_Y:   'Buy X Get Y',
};

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
      const matchesFilter =
        f === 'all' ||
        (f === 'active' && !this.isExpired(o)) ||
        (f === 'expired' && this.isExpired(o));
      const matchesSearch = !q ||
        o.offerName.toLowerCase().includes(q) ||
        o.offerCode.toLowerCase().includes(q) ||
        TYPE_LABELS[o.offerType].toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  readonly pagedOffers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOffers().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => {
    const all = this.offers();
    const active = all.filter(o => !this.isExpired(o)).length;
    const expired = all.filter(o => this.isExpired(o)).length;
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
        value: expired,
        label: 'Expired',
        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        iconBg: 'rgba(239,68,68,0.15)',
        iconColor: '#ef4444',
        valueColor: '#ef4444'
      }
    ];
  });

  // Counts are shown in the stats strip above, so the filter pills omit them.
  readonly filterOptions: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' }
  ];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Create Offer', icon: 'add', type: 'primary', action: () => this.openCreate() }
  ];

  constructor(private readonly offerService: OfferService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Only the standalone pool — offers not yet assigned to a user/outlet/item.
    this.offerService.list(true)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offers) => this.offers.set(offers),
        error: () => this.toastService.error('Failed to load offers'),
      });
  }

  openCreate(): void {
    this.modalService.openAddOffer().subscribe(value => {
      if (!value) return;
      this.offerService.create(value as unknown as OfferPayload).subscribe({
        next: () => { this.toastService.success('Offer created'); this.load(); },
        error: () => this.toastService.error('Failed to create offer'),
      });
    });
  }

  openEdit(offer: Offer): void {
    this.modalService.openEditOffer(offer as unknown as Record<string, unknown>).subscribe(value => {
      if (!value) return;
      this.offerService.update(offer.offerId, value as unknown as OfferPayload).subscribe({
        next: () => { this.toastService.success('Offer updated'); this.load(); },
        error: () => this.toastService.error('Failed to update offer'),
      });
    });
  }

  confirmDelete(offer: Offer): void {
    this.modalService.openConfirm({ title: 'Delete Offer', message: `Delete offer "${offer.offerName}" (${offer.offerCode})?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.offerService.delete(offer.offerId).subscribe({
          next: () => { this.toastService.success('Offer deleted'); this.load(); },
          error: () => this.toastService.error('Failed to delete offer'),
        });
      });
  }

  isExpired(offer: Offer): boolean {
    return !!offer.offerExpiry && offer.offerExpiry.getTime() < Date.now();
  }

  status(offer: Offer): string {
    return this.isExpired(offer) ? 'expired' : 'active';
  }

  typeLabel(offer: Offer): string {
    return TYPE_LABELS[offer.offerType];
  }

  expiryLabel(offer: Offer): string {
    if (!offer.offerExpiry) return 'No expiry';
    return offer.offerExpiry.toLocaleDateString();
  }

  offerStats(offer: Offer): ListStat[] {
    return [
      { value: this.typeLabel(offer), label: 'Type' },
      { value: this.expiryLabel(offer), label: 'Expires' }
    ];
  }

  discountLabel(offer: Offer): string {
    switch (offer.offerType) {
      case 'PERCENTAGE':    return offer.offerDiscount + '% OFF';
      case 'FLAT':          return '₹' + offer.offerDiscount + ' OFF';
      case 'FREE_DELIVERY': return 'Free Delivery';
      case 'BUY_X_GET_Y':   return 'Buy X Get Y';
    }
  }
}
