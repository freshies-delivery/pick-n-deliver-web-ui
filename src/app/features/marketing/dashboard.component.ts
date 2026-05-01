import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: { name: string; email: string } | null = null;
  activeTab = 'dashboard';

  orders = [
    { store: 'FreshMart Supermarket', time: 'Today 2:14 PM', items: 6, status: 'En Route', statusClass: 'amber' },
    { store: 'TopCut Butchery', time: 'Today 11:40 AM', items: 3, status: 'Delivered', statusClass: 'green' },
    { store: 'Green Thumb Nursery', time: 'Yesterday', items: 2, status: 'Delivered', statusClass: 'green' },
    { store: 'Hardware Hub', time: 'Apr 29', items: 5, status: 'Scheduled', statusClass: 'blue' },
  ];

  stores = [
    { icon: '🛒', name: 'FreshMart', category: 'Supermarket', orders: 42 },
    { icon: '🥩', name: 'TopCut Butchery', category: 'Meat & Seafood', orders: 18 },
    { icon: '🍷', name: 'Cellar Direct', category: 'Alcohol & Beverages', orders: 11 },
    { icon: '🌿', name: 'Green Thumb', category: 'Nursery & Plants', orders: 7 },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/']);
        return;
      }
      this.user = user;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  get initials(): string {
    if (!this.user) return '?';
    return this.user.name.charAt(0).toUpperCase();
  }
}
