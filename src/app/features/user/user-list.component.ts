import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { ColumnConfig, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PageHeaderAction, PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserDto, UserService } from './services/user.service';
import { UserContextService } from '../../core/services/user-context.service';
import { FabActionService } from '../../core/services/fab-action.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
  readonly loading = signal(false);
  readonly users = signal<UserDto[]>([]);

  readonly columns: ColumnConfig[] = [
    { key: 'userId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add User',
      icon: 'add',
      type: 'primary',
      action: () => this.openCreateDialog()
    }
  ];

  constructor(
    private readonly userService: UserService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly userContext: UserContextService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.fabActionService.registerAction('createUser', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createUser');
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => this.snackBar.open('Unable to load users', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<UserDto>, {
        data: { title: 'Add User', fields: this.fields }
      })
      .afterClosed()
      .subscribe((value: Partial<UserDto> | undefined) => {
        if (!value) return;
        this.userService.create(value as UserDto).subscribe({
          next: () => {
            this.snackBar.open('User created', 'Close', { duration: 2500 });
            this.loadUsers();
          },
          error: () => this.snackBar.open('Failed to create user', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(user: UserDto): void {
    this.dialog
      .open(GenericFormDialogComponent<UserDto>, {
        data: { title: `Edit ${user.name}`, fields: this.fields, initialValue: user }
      })
      .afterClosed()
      .subscribe((value: Partial<UserDto> | undefined) => {
        if (!value || !user.userId) return;
        this.userService.update(user.userId, { ...user, ...value }).subscribe({
          next: () => {
            this.snackBar.open('User updated', 'Close', { duration: 2500 });
            this.loadUsers();
          },
          error: () => this.snackBar.open('Failed to update user', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(user: UserDto): void {
    if (!user.userId) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete User', message: `Are you sure you want to delete ${user.name}?` }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.userService.delete(user.userId!).subscribe({
          next: () => {
            this.snackBar.open('User deleted', 'Close', { duration: 2500 });
            this.loadUsers();
          },
          error: () => this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 })
        });
      });
  }

  openUserOrders(user: UserDto): void {
    if (!user.userId) return;
    this.userContext.setUser(user.userId, user.name ?? null);
    this.router.navigate(['/dashboard/users', user.userId, 'orders']);
  }
}
