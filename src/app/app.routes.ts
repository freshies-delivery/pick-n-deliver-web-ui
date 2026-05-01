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
      { path: 'users', loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES) }
    ]
  },
  { path: '**', redirectTo: '' }
];
