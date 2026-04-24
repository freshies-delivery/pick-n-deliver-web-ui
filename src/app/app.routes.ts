import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'client' },
  {
	path: 'client',
	loadChildren: () => import('./features/client/client.routes').then((m) => m.CLIENT_ROUTES)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user/user.routes').then((m) => m.USER_ROUTES)
  },
  { path: '**', redirectTo: 'client' }
];
