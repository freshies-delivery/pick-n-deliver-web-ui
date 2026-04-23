import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { GenericTableComponent, TableColumn } from '../../shared/components/generic-table/generic-table.component';
import { ClientDto, ClientService } from './services/client.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    BreadcrumbsComponent,
    GenericTableComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit {
  readonly loading = signal(false);
  readonly clients = signal<ClientDto[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'clientId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' }
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients();
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

    this.router.navigate(['/client', client.clientId, 'outlets']);
  }
}

