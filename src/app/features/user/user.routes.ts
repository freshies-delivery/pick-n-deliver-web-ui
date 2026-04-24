import { Routes } from '@angular/router';
import { UserHierarchyGuard } from '../../core/guards/user-hierarchy.guard';
import { UserListComponent } from './user-list.component';
import { UserOrdersComponent } from './user-orders.component';
import { UserAddressesComponent } from './user-addresses.component';
import { UserRatingsComponent } from './user-ratings.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent
  },
  {
    path: ':userId/orders',
    component: UserOrdersComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/addresses',
    component: UserAddressesComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/ratings',
    component: UserRatingsComponent,
    canActivate: [UserHierarchyGuard]
  }
];

