import { Routes } from '@angular/router';
import { UserHierarchyGuard } from '../../core/guards/user-hierarchy.guard';
import { UserListComponent } from './user-list.component';
import { UserDashboardComponent } from './user-dashboard.component';
import { UserOrdersComponent } from './user-orders.component';
import { UserAddressesComponent } from './user-addresses.component';
import { UserRatingsComponent } from './user-ratings.component';
import { UserActivityComponent } from './user-activity.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent
  },
  {
    path: ':userId/overview',
    component: UserDashboardComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/orders',
    component: UserOrdersComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/ratings',
    component: UserRatingsComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/addresses',
    component: UserAddressesComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/activity',
    component: UserActivityComponent,
    canActivate: [UserHierarchyGuard]
  },
];
