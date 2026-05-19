import { Routes } from '@angular/router';
import { UserHierarchyGuard } from '../../core/guards/user-hierarchy.guard';
import { UserListComponent } from './user-list.component';
import { UserDashboardComponent } from './user-dashboard.component';
import { UserActivityComponent } from './user-activity.component';
import { UserExploreComponent } from './user-explore.component';

export const USER_ROUTES: Routes = [
  { path: '', redirectTo: 'explore', pathMatch: 'full' },
  { path: 'explore', component: UserExploreComponent },
  { path: 'list', component: UserListComponent },
  {
    path: ':userId/overview',
    component: UserDashboardComponent,
    canActivate: [UserHierarchyGuard]
  },
  {
    path: ':userId/activity',
    component: UserActivityComponent,
    canActivate: [UserHierarchyGuard]
  },
];
