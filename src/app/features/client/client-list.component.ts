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
import { ClientDto, ClientService } from './services/client.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';
import { FabActionService } from '../../core/services/fab-action.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent implements OnInit, OnDestroy {
  readonly loading = signal(false);
  readonly clients = signal<ClientDto[]>([]);

  readonly columns: ColumnConfig[] = [
    { key: 'clientId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' }
  ];

  readonly headerActions: PageHeaderAction[] = [
    {
      label: 'Add Client',
      icon: 'add',
      type: 'primary',
      action: () => this.openCreateDialog()
    }
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly hierarchyState: HierarchyStateService,
    private readonly fabActionService: FabActionService
  ) {}

  ngOnInit(): void {
    this.fabActionService.registerAction('createClient', () => this.openCreateDialog());
    this.fabActionService.setFabAction(() => this.openCreateDialog());
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.fabActionService.unregisterAction('createClient');
  }

  loadClients(): void {
    this.loading.set(true);
    this.clientService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (clients) => this.clients.set(clients),
        error: () => this.snackBar.open('Unable to load clients', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<ClientDto>, {
        data: {
          title: 'Add Client',
          fields: this.fields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<ClientDto> | undefined) => {
        if (!value) {
          return;
        }

        this.clientService.create(value as ClientDto).subscribe({
          next: () => {
            this.snackBar.open('Client created', 'Close', { duration: 2500 });
            this.loadClients();
          },
          error: () => this.snackBar.open('Failed to create client', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(client: ClientDto): void {
    this.dialog
      .open(GenericFormDialogComponent<ClientDto>, {
        data: {
          title: `Edit ${client.name}`,
          fields: this.fields,
          initialValue: client
        }
      })
      .afterClosed()
      .subscribe((value: Partial<ClientDto> | undefined) => {
        if (!value || !client.clientId) {
          return;
        }

        this.clientService.update(client.clientId, { ...client, ...value }).subscribe({
          next: () => {
            this.snackBar.open('Client updated', 'Close', { duration: 2500 });
            this.loadClients();
          },
          error: () => this.snackBar.open('Failed to update client', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(client: ClientDto): void {
    if (!client.clientId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Client',
          message: `Are you sure you want to delete ${client.name}?`
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.clientService.delete(client.clientId!).subscribe({
          next: () => {
            this.snackBar.open('Client deleted', 'Close', { duration: 2500 });
            this.loadClients();
          },
          error: () => this.snackBar.open('Failed to delete client', 'Close', { duration: 3000 })
        });
      });
  }

  openOutlets(client: ClientDto): void {
    if (!client.clientId) {
      return;
    }

    this.hierarchyState.setClient(client.clientId, client.name ?? null);
    this.router.navigate(['/client', client.clientId, 'outlets']);
  }
}

