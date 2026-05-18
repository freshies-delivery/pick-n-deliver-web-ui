import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list.component';
import { ClientExploreComponent } from './client-explore.component';
import { OutletListComponent } from './outlet-list.component';
import { OutletDetailComponent } from './outlet-detail.component';
import { ItemListComponent } from './item-list.component';
import { ClientDashboardTabComponent } from './client-dashboard-tab.component';
import { ClientOrdersTabComponent } from './client-orders-tab.component';
import { ClientRatingsTabComponent } from './client-ratings-tab.component';
import { ClientAnalyticsTabComponent } from './client-analytics-tab.component';
import { HierarchyGuard } from '../../core/guards/hierarchy.guard';

export const CLIENT_ROUTES: Routes = [
  { path: '', redirectTo: 'explore', pathMatch: 'full' },
  { path: 'explore', component: ClientExploreComponent },
  {
    path: 'list',
    component: ClientListComponent,
    data: { showFab: true, fabAction: 'createClient' }
  },
  {
    path: ':clientId/dashboard',
    component: ClientDashboardTabComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/orders',
    component: ClientOrdersTabComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/ratings',
    component: ClientRatingsTabComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/analytics',
    component: ClientAnalyticsTabComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets',
    component: OutletListComponent,
    canActivate: [HierarchyGuard],
    data: { showFab: true, fabAction: 'createOutlet' }
  },
  {
    path: ':clientId/outlets/:outletId',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/address',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/categories',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/ratings',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/dashboard',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/orders',
    component: OutletDetailComponent,
    canActivate: [HierarchyGuard]
  },
  {
    path: ':clientId/outlets/:outletId/categories/:categoryId/items',
    component: ItemListComponent,
    canActivate: [HierarchyGuard],
    data: { showFab: true, fabAction: 'createItem' }
  }
];
