import {
  Component, OnInit, computed, signal,
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
import { UserContextService } from '../../core/services/user-context.service';
import { Offer, OfferType, OfferPayload, OfferService } from '../admin/offer.service';

const TYPE_LABELS: Record<OfferType, string> = {
  PERCENTAGE:    'Percentage',
  FLAT:          'Flat',
  FREE_DELIVERY: 'Free Delivery',
  BUY_X_GET_Y:   'Buy X Get Y',
};

@Component({
  selector: 'app-user-offers',
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
  templateUrl: './user-offers.component.html',
  styleUrl: './user-offers.component.scss',
})
export class UserOffersComponent implements OnInit {
  readonly userId    = signal(0);
  readonly loading   = signal(true);
  readonly offers    = signal<Offer[]>([]);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  readonly headerActions: PageHeaderAction[] = [
    { label: 'Create Offer', icon: 'add', type: 'primary', action: () => this.createOfferForUser() },
  ];

  private readonly userContext  = inject(UserContextService);
  private readonly offerService = inject(OfferService);
  private readonly modalService = inject(ModalService);
  private readonly toast        = inject(ToastService);
  private readonly route        = inject(ActivatedRoute);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.offerService.listByUser(this.userId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: offers => this.offers.set(offers),
        error: () => this.toast.error('Failed to load offers'),
      });
  }

  createOfferForUser(): void {
    this.modalService.openAddOffer().subscribe(value => {
      if (!value) return;
      const payload: OfferPayload = { ...(value as unknown as OfferPayload), userIds: [this.userId()] };
      this.offerService.create(payload).subscribe({
        next: () => { this.toast.success('Offer created for this user'); this.load(); },
        error: () => this.toast.error('Failed to create offer'),
      });
    });
  }

  openEdit(offer: Offer): void {
    // The edit modal only returns offer fields (no target arrays), so the backend
    // leaves this offer's user/outlet/item assignments untouched.
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
