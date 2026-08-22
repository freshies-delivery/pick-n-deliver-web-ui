import {
  Component, OnInit, signal, computed,
  ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { Offer, OfferType, OfferPayload, OfferService } from '../admin/offer.service';

const TYPE_LABELS: Record<OfferType, string> = {
  PERCENTAGE:    'Percentage',
  FLAT:          'Flat',
  FREE_DELIVERY: 'Free Delivery',
  BUY_X_GET_Y:   'Buy X Get Y',
};

@Component({
  selector: 'app-client-offers-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RichListItemComponent,
    SkeletonListComponent,
    EmptyStateComponent,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './client-offers-tab.component.html',
  styleUrl: './client-offers-tab.component.scss',
})
export class ClientOffersTabComponent implements OnInit {
  readonly clientId   = signal(0);
  readonly loading    = signal(true);
  readonly offers     = signal<Offer[]>([]);
  readonly clientName = computed(() => this.hierService.state.clientName ?? `Client #${this.clientId()}`);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Create Offer', icon: 'add', type: 'primary', action: () => this.createOffer() },
  ];

  private readonly offerService = inject(OfferService);
  private readonly modalService = inject(ModalService);
  private readonly toast        = inject(ToastService);
  private readonly hierService  = inject(HierarchyStateService);
  private readonly route        = inject(ActivatedRoute);

  constructor() {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.offerService.listByClient(this.clientId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: offers => this.offers.set(offers),
        error: () => this.toast.error('Failed to load offers'),
      });
  }

  createOffer(): void {
    this.modalService.openAddOffer().subscribe(value => {
      if (!value) return;
      this.offerService.createForClient(this.clientId(), value as unknown as OfferPayload).subscribe({
        next: () => { this.toast.success('Offer created for all outlets under this client'); this.load(); },
        error: () => this.toast.error('Failed to create offer'),
      });
    });
  }

  openEdit(offer: Offer): void {
    this.modalService.openEditOffer(offer as unknown as Record<string, unknown>).subscribe(value => {
      if (!value) return;
      this.offerService.update(offer.offerId, value as unknown as OfferPayload).subscribe({
        next: () => { this.toast.success('Offer updated'); this.load(); },
        error: () => this.toast.error('Failed to update offer'),
      });
    });
  }

  confirmDelete(offer: Offer): void {
    this.modalService.openConfirm({ title: 'Delete Offer', message: `Delete offer "${offer.offerName}" (${offer.offerCode})?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.offerService.delete(offer.offerId).subscribe({
          next: () => { this.toast.success('Offer deleted'); this.load(); },
          error: () => this.toast.error('Failed to delete offer'),
        });
      });
  }

  status(offer: Offer): string {
    return !!offer.offerExpiry && offer.offerExpiry.getTime() < Date.now() ? 'expired' : 'active';
  }

  expiryLabel(offer: Offer): string {
    return offer.offerExpiry ? offer.offerExpiry.toLocaleDateString() : 'No expiry';
  }

  discountLabel(offer: Offer): string {
    switch (offer.offerType) {
      case 'PERCENTAGE':    return offer.offerDiscount + '% OFF';
      case 'FLAT':          return '₹' + offer.offerDiscount + ' OFF';
      case 'FREE_DELIVERY': return 'Free Delivery';
      case 'BUY_X_GET_Y':   return 'Buy X Get Y';
      default:              return '';
    }
  }

  offerStats(offer: Offer): ListStat[] {
    return [
      { value: TYPE_LABELS[offer.offerType], label: 'Type' },
      { value: this.expiryLabel(offer), label: 'Expires' },
    ];
  }
}
