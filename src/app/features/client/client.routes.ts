import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list.component';
import { OutletListComponent } from './outlet-list.component';
import { OutletDetailComponent } from './outlet-detail.component';
import { ItemListComponent } from './item-list.component';

export const CLIENT_ROUTES: Routes = [
  { path: 'clients', component: ClientListComponent },
  { path: ':clientId/outlets', component: OutletListComponent },
  { path: ':clientId/outlets/:outletId', component: OutletDetailComponent },
  { path: ':clientId/outlets/:outletId/categories/:categoryId/items', component: ItemListComponent }
];

