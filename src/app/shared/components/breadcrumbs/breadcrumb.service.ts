import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  route: string;
  isLast: boolean;
}

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  outlets: 'Outlets',
  categories: 'Categories',
  items: 'Items',
  ratings: 'Ratings',
  users: 'Users',
  orders: 'Orders',
  addresses: 'Addresses',
  admin: 'Admin',
  segments: 'Segments',
  config: 'Config',
  offers: 'Offers',
  notifications: 'Notifications',
  overview: 'Overview'
};

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly subject = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this.subject.asObservable();

  constructor(private readonly router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.update());
    this.update();
  }

  private update(): void {
    const url = this.router.url.split('?')[0];
    const raw = this.parse(url);
    this.subject.next(raw.map((c, i) => ({ ...c, isLast: i === raw.length - 1 })));
  }

  private parse(url: string): Omit<BreadcrumbItem, 'isLast'>[] {
    const segments = url.split('/').filter(Boolean);
    const crumbs: Omit<BreadcrumbItem, 'isLast'>[] = [];
    let path = '';

    for (const seg of segments) {
      path += '/' + seg;
      const label = LABEL_MAP[seg];
      if (label) {
        crumbs.push({ label, route: path });
      }
      // Skip numeric IDs silently — they don't produce a breadcrumb entry
    }

    return crumbs;
  }
}
