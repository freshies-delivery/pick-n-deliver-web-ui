import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/marketing/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/marketing/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'client', loadChildren: () => import('./features/client/client.routes').then(m => m.CLIENT_ROUTES) },
      { path: 'users', loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES) },
      { path: 'overview', loadComponent: () => import('./features/admin/admin-overview.component').then(m => m.AdminOverviewComponent) },
      { path: 'admin/segments', loadComponent: () => import('./features/admin/segments.component').then(m => m.SegmentsComponent) },
      { path: 'admin/config', loadComponent: () => import('./features/admin/config-page.component').then(m => m.ConfigPageComponent) },
      { path: 'admin/offers', loadComponent: () => import('./features/admin/offers.component').then(m => m.OffersComponent) },
      { path: 'admin/notifications', loadComponent: () => import('./features/admin/notifications-page.component').then(m => m.NotificationsPageComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
