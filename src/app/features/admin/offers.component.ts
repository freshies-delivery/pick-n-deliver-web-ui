import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Offer, OfferService } from './offer.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss'
})
export class OffersComponent implements OnInit {
  readonly loading = signal(true);
  readonly offers = signal<Offer[]>([]);
  readonly filter = signal<'all' | 'active' | 'expired' | 'scheduled'>('all');

  constructor(private readonly offerService: OfferService) {}

  ngOnInit(): void {
    this.offerService.list().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get filtered(): Offer[] {
    const f = this.filter();
    if (f === 'all') return this.offers();
    return this.offers().filter((o) => o.status === f);
  }

  setFilter(f: 'all' | 'active' | 'expired' | 'scheduled'): void {
    this.filter.set(f);
  }

  usagePercent(offer: Offer): number {
    return Math.round((offer.usageCount / offer.usageLimit) * 100);
  }
}
