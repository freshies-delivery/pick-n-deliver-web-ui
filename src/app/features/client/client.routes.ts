import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list.component';
import { OutletListComponent } from './outlet-list.component';
import { OutletDetailComponent } from './outlet-detail.component';
import { ItemListComponent } from './item-list.component';
import { HierarchyGuard } from '../../core/guards/hierarchy.guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientListComponent,
    data: { showFab: true, fabAction: 'createClient' }
  },
  { path: 'clients', redirectTo: '', pathMatch: 'full' },
  {
    path: ':clientId/outlets',
    component: OutletListComponent,
    canActivate: [HierarchyGuard],
    data: { showFab: true, fabAction: 'createOutlet' }
  },
  { path: ':clientId/outlets/:outletId', component: OutletDetailComponent, canActivate: [HierarchyGuard] },
  { path: ':clientId/outlets/:outletId/categories', component: OutletDetailComponent, canActivate: [HierarchyGuard] },
  {
    path: ':clientId/outlets/:outletId/categories/:categoryId/items',
    component: ItemListComponent,
    canActivate: [HierarchyGuard],
    data: { showFab: true, fabAction: 'createItem' }
  }
];

