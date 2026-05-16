import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeaderAction, PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatsStripComponent, StripStat } from '../../shared/components/stats-strip/stats-strip.component';
import { PageToolbarComponent, FilterOption } from '../../shared/components/page-toolbar/page-toolbar.component';
import { RichListItemComponent, ListStat } from '../../shared/components/rich-list-item/rich-list-item.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { UserDto, UserService } from './services/user.service';
import { UserContextService } from '../../core/services/user-context.service';
import { FabActionService } from '../../core/services/fab-action.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    StatsStripComponent,
    PageToolbarComponent,
    RichListItemComponent,
    SkeletonListComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit, OnDestroy {
  readonly loading     = signal(false);
  readonly users       = signal<UserDto[]>([]);
  readonly searchQuery = signal('');
  readonly activeFilter= signal<string>('all');
  readonly currentPage = signal(1);
  readonly pageSize    = 10;

  readonly filteredUsers = computed(() => {
    const q  = this.searchQuery().toLowerCase().trim();
    const f  = this.activeFilter();
    return this.users().filter(u => {
      const matchesSearch = !q ||
        (u.name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q);
      return matchesSearch;
    });
  });

  readonly pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  readonly statsStrip = computed((): StripStat[] => [
    {
      value: this.users().length,
      label: 'Total Users',
      iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#A5B4FC',
    },
    {
      value: this.users().filter(u => u.email).length,
      label: 'With Email',
      iconPath: 'M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#86EFAC',
      valueColor: '#86EFAC',
    },
    {
      value: this.users().filter(u => u.phone).length,
      label: 'With Phone',
      iconPath: 'M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z',
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: '#93C5FD',
      valueColor: '#93C5FD',
    },
    {
      value: this.filteredUsers().length,
      label: 'Showing',
      iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#FCD34D',
    },
  ]);

  readonly filterOptions = computed((): FilterOption[] => [
    { value: 'all', label: 'All', count: this.users().length },
  ]);

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add User',
      icon: 'add',
      type: 'primary',
      action: () => this.openCreateDialog(),
    },
  ];

  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly userContext: UserContextService,
    private readonly fabActionService: FabActionService,
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
        next: users => this.users.set(users),
        error: () => this.toastService.error('Unable to load users'),
      });
  }

  openCreateDialog(): void {
    this.modalService.openAddUser().subscribe(value => {
      if (!value) return;
      this.userService.create(value as UserDto).subscribe({
        next: () => { this.toastService.success('User created'); this.loadUsers(); },
        error: () => this.toastService.error('Failed to create user'),
      });
    });
  }

  openEditDialog(user: UserDto): void {
    this.modalService.openEditUser(user).subscribe(value => {
      if (!value || !user.userId) return;
      this.userService.update(user.userId, { ...user, ...value }).subscribe({
        next: () => { this.toastService.success('User updated'); this.loadUsers(); },
        error: () => this.toastService.error('Failed to update user'),
      });
    });
  }

  confirmDelete(user: UserDto): void {
    if (!user.userId) return;
    this.modalService.openConfirm({ title: 'Delete User', message: `Delete ${user.name}?` })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.userService.delete(user.userId!).subscribe({
          next: () => { this.toastService.success('User deleted'); this.loadUsers(); },
          error: () => this.toastService.error('Failed to delete user'),
        });
      });
  }

  openUserOrders(user: UserDto): void {
    if (!user.userId) return;
    this.userContext.setUser(user.userId, user.name ?? null);
    this.router.navigate(['/dashboard/users', user.userId, 'orders']);
  }

  userStats(user: UserDto): ListStat[] {
    return [
      { value: user.userId ?? '-', label: 'ID' },
      { value: user.email ?? '-',  label: 'Email' },
      { value: user.phone ?? '-',  label: 'Phone' },
    ];
  }

  userInitials(user: UserDto): string {
    if (!user.name) return '?';
    return user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
