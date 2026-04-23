import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { GenericTableComponent, TableColumn } from '../../shared/components/generic-table/generic-table.component';
import { OutletDto, OutletService } from './services/outlet.service';

@Component({
  selector: 'app-outlet-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, BreadcrumbsComponent, GenericTableComponent],
  templateUrl: './outlet-list.component.html',
  styleUrl: './outlet-list.component.css'
})
export class OutletListComponent implements OnInit {
  readonly clientId = signal(0);
  readonly loading = signal(false);
  readonly outlets = signal<OutletDto[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'outletId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' }
  ];

  readonly fields: DialogFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'isVeg', label: 'Vegetarian', type: 'checkbox' },
    { key: 'isPickupAvailable', label: 'Pickup Available', type: 'checkbox' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly outletService: OutletService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.loadOutlets();
  }

  loadOutlets(): void {
    this.loading.set(true);
    this.outletService
      .list(this.clientId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (outlets) => this.outlets.set(outlets),
        error: () => this.snackBar.open('Unable to load outlets', 'Close', { duration: 3000 })
      });
  }

  openCreateDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<OutletDto>, {
        data: {
          title: 'Add Outlet',
          fields: this.fields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<OutletDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: OutletDto = {
          ...value,
          clientId: this.clientId() // map1
        } as OutletDto;

        this.outletService.create(payload).subscribe({
          next: () => {
            this.snackBar.open('Outlet created', 'Close', { duration: 2500 });
            this.loadOutlets();
          },
          error: () => this.snackBar.open('Failed to create outlet', 'Close', { duration: 3000 })
        });
      });
  }

  openEditDialog(outlet: OutletDto): void {
    this.dialog
      .open(GenericFormDialogComponent<OutletDto>, {
        data: {
          title: `Edit ${outlet.name}`,
          fields: this.fields,
          initialValue: outlet
        }
      })
      .afterClosed()
      .subscribe((value: Partial<OutletDto> | undefined) => {
        if (!value || !outlet.outletId) {
          return;
        }

        const payload: OutletDto = {
          ...outlet,
          ...value,
          clientId: this.clientId() // map1
        };

        this.outletService.update(outlet.outletId, payload).subscribe({
          next: () => {
            this.snackBar.open('Outlet updated', 'Close', { duration: 2500 });
            this.loadOutlets();
          },
          error: () => this.snackBar.open('Failed to update outlet', 'Close', { duration: 3000 })
        });
      });
  }

  confirmDelete(outlet: OutletDto): void {
    if (!outlet.outletId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Outlet',
          message: `Are you sure you want to delete ${outlet.name}?`
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.outletService.delete(outlet.outletId!).subscribe({
          next: () => {
            this.snackBar.open('Outlet deleted', 'Close', { duration: 2500 });
            this.loadOutlets();
          },
          error: () => this.snackBar.open('Failed to delete outlet', 'Close', { duration: 3000 })
        });
      });
  }

  openDetails(outlet: OutletDto): void {
    if (!outlet.outletId) {
      return;
    }

    this.router.navigate(['/client', this.clientId(), 'outlets', outlet.outletId]);
  }
}

