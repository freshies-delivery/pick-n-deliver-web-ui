import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PageHeaderAction, PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserContextService } from '../../core/services/user-context.service';

interface UserListItem {
  userId: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  readonly loading = signal(false);

  readonly users = signal<UserListItem[]>([
    { userId: 101, name: 'John Doe', email: 'john@example.com' },
    { userId: 102, name: 'Anita Roy', email: 'anita@example.com' },
    { userId: 103, name: 'Mark Lee', email: 'mark@example.com' }
  ]);

  readonly columns: ColumnConfig[] = [
    { key: 'userId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add User',
      icon: 'add',
      type: 'primary',
      action: () => this.snackBar.open('User creation flow can be plugged in here', 'Close', { duration: 2500 })
    }
  ];

  constructor(
    private readonly router: Router,
    private readonly userContext: UserContextService,
    private readonly snackBar: MatSnackBar
  ) {}

  openUserOrders(user: UserListItem): void {
    this.userContext.setUser(user.userId, user.name);
    this.router.navigate(['/users', user.userId, 'orders']);
  }

  onEdit(user: UserListItem): void {
    this.snackBar.open(`Edit ${user.name}`, 'Close', { duration: 2000 });
  }

  onDelete(user: UserListItem): void {
    this.snackBar.open(`Delete ${user.name}`, 'Close', { duration: 2000 });
  }
}

