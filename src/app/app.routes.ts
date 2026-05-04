import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/marketing/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/admin-overview.component').then(
            (m) => m.AdminOverviewComponent
          )
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/client/client.routes').then((m) => m.CLIENT_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/user/user.routes').then((m) => m.USER_ROUTES)
      },
      {
        path: 'admin/segments',
        loadComponent: () =>
          import('./features/admin/segments.component').then((m) => m.SegmentsComponent)
      },
      {
        path: 'admin/config',
        loadComponent: () =>
          import('./features/admin/config-page.component').then((m) => m.ConfigPageComponent)
      },
      {
        path: 'admin/offers',
        loadComponent: () =>
          import('./features/admin/offers.component').then((m) => m.OffersComponent)
      },
      {
        path: 'admin/notifications',
        loadComponent: () =>
          import('./features/admin/notifications-page.component').then(
            (m) => m.NotificationsPageComponent
          )
      },
      { path: '**', redirectTo: '' }
    ]
  },
  { path: '**', redirectTo: '' }
];
