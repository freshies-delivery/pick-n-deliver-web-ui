import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize, forkJoin } from 'rxjs';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { CategoryListComponent } from './category-list.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DialogFieldConfig,
  GenericFormDialogComponent
} from '../../shared/components/generic-form-dialog/generic-form-dialog.component';
import { GenericTableComponent, TableColumn } from '../../shared/components/generic-table/generic-table.component';
import { AddressDto, AddressService } from './services/address.service';
import { CategoryDto } from './services/category.service';
import { RatingCommentDto, RatingDto, RatingService } from './services/rating.service';

@Component({
  selector: 'app-outlet-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    BreadcrumbsComponent,
    CategoryListComponent,
    GenericTableComponent
  ],
  templateUrl: './outlet-detail.component.html',
  styleUrl: './outlet-detail.component.css'
})
export class OutletDetailComponent implements OnInit {
  readonly clientId = signal(0);
  readonly outletId = signal(0);

  readonly loadingAddress = signal(false);
  readonly loadingRatings = signal(false);

  readonly outletAddress = signal<AddressDto | null>(null);
  readonly ratings = signal<RatingDto[]>([]);
  readonly ratingComments = signal<RatingCommentDto[]>([]);

  readonly addressFields: DialogFieldConfig[] = [
    { key: 'doorNo', label: 'Door No', type: 'text' },
    { key: 'buildingName', label: 'Building Name', type: 'text' },
    { key: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { key: 'addressLine2', label: 'Address Line 2', type: 'text' },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'Zip Code', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'instructions', label: 'Instructions', type: 'textarea' }
  ];

  readonly ratingFields: DialogFieldConfig[] = [
    { key: 'userId', label: 'User ID', type: 'number', required: true },
    { key: 'score', label: 'Rating', type: 'number', required: true },
    { key: 'comment', label: 'Comments', type: 'textarea' }
  ];

  readonly ratingCommentFields: DialogFieldConfig[] = [
    { key: 'comment', label: 'Comment', type: 'textarea', required: true }
  ];

  readonly ratingColumns: TableColumn[] = [
    { key: 'ratingId', label: 'ID' },
    { key: 'score', label: 'Rating' },
    { key: 'comment', label: 'Comments' }
  ];

  readonly commentColumns: TableColumn[] = [
    { key: 'ratingCommentId', label: 'ID' },
    { key: 'comment', label: 'Comment' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly addressService: AddressService,
    private readonly ratingService: RatingService
  ) {}

  ngOnInit(): void {
    this.clientId.set(Number(this.route.snapshot.paramMap.get('clientId')));
    this.outletId.set(Number(this.route.snapshot.paramMap.get('outletId')));
    this.loadAddress();
    this.loadRatingsAndComments();
  }

  loadAddress(): void {
    this.loadingAddress.set(true);
    this.addressService
      .listByOutlet(this.outletId())
      .pipe(finalize(() => this.loadingAddress.set(false)))
      .subscribe({
        next: (addresses) => this.outletAddress.set(addresses[0] ?? null),
        error: () => this.snackBar.open('Unable to load address', 'Close', { duration: 3000 })
      });
  }

  loadRatingsAndComments(): void {
    this.loadingRatings.set(true);
    forkJoin({
      ratings: this.ratingService.listForOutlet(this.outletId()),
      comments: this.ratingService.listComments('OUTLET')
    })
      .pipe(finalize(() => this.loadingRatings.set(false)))
      .subscribe({
        next: ({ ratings, comments }) => {
          this.ratings.set(ratings);
          this.ratingComments.set(comments);
        },
        error: () => this.snackBar.open('Unable to load ratings data', 'Close', { duration: 3000 })
      });
  }

  openAddressDialog(): void {
    const address = this.outletAddress();
    this.dialog
      .open(GenericFormDialogComponent<AddressDto>, {
        data: {
          title: address ? 'Edit Address' : 'Add Address',
          fields: this.addressFields,
          initialValue: address ?? undefined
        }
      })
      .afterClosed()
      .subscribe((value: Partial<AddressDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: AddressDto = {
          ...address,
          ...value,
          outletId: this.outletId() // map4
        };

        const request = address?.addressId
          ? this.addressService.update(address.addressId, payload)
          : this.addressService.create(payload);

        request.subscribe({
          next: () => {
            this.snackBar.open('Address saved', 'Close', { duration: 2500 });
            this.loadAddress();
          },
          error: () => this.snackBar.open('Failed to save address', 'Close', { duration: 3000 })
        });
      });
  }

  deleteAddress(): void {
    const address = this.outletAddress();
    if (!address?.addressId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Address',
          message: 'Are you sure you want to delete this address?'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.addressService.delete(address.addressId!).subscribe({
          next: () => {
            this.snackBar.open('Address deleted', 'Close', { duration: 2500 });
            this.loadAddress();
          },
          error: () => this.snackBar.open('Failed to delete address', 'Close', { duration: 3000 })
        });
      });
  }

  openCategoryItems(category: CategoryDto): void {
    if (!category.categoryId) {
      return;
    }

    this.router.navigate([
      '/client',
      this.clientId(),
      'outlets',
      this.outletId(),
      'categories',
      category.categoryId,
      'items'
    ]);
  }

  openCreateRatingDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<RatingDto>, {
        data: {
          title: 'Add Rating',
          fields: this.ratingFields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<RatingDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: RatingDto = {
          ...value,
          targetType: 'OUTLET',
          targetId: this.outletId() // map5
        };

        this.ratingService.createRating(payload).subscribe({
          next: () => {
            this.snackBar.open('Rating saved', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to save rating', 'Close', { duration: 3000 })
        });
      });
  }

  openEditRatingDialog(rating: RatingDto): void {
    if (!rating.ratingId) {
      return;
    }

    this.dialog
      .open(GenericFormDialogComponent<RatingDto>, {
        data: {
          title: 'Edit Rating',
          fields: this.ratingFields,
          initialValue: rating
        }
      })
      .afterClosed()
      .subscribe((value: Partial<RatingDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: RatingDto = {
          ...rating,
          ...value,
          targetType: 'OUTLET',
          targetId: this.outletId() // map5
        };

        this.ratingService.updateRating(rating.ratingId!, payload).subscribe({
          next: () => {
            this.snackBar.open('Rating updated', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to update rating', 'Close', { duration: 3000 })
        });
      });
  }

  deleteRating(rating: RatingDto): void {
    if (!rating.ratingId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Rating',
          message: 'Are you sure you want to delete this rating?'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.ratingService.deleteRating(rating.ratingId!).subscribe({
          next: () => {
            this.snackBar.open('Rating deleted', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to delete rating', 'Close', { duration: 3000 })
        });
      });
  }

  openCreateCommentDialog(): void {
    this.dialog
      .open(GenericFormDialogComponent<RatingCommentDto>, {
        data: {
          title: 'Add Rating Comment',
          fields: this.ratingCommentFields
        }
      })
      .afterClosed()
      .subscribe((value: Partial<RatingCommentDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: RatingCommentDto = {
          ...value,
          targetType: 'OUTLET'
        };

        this.ratingService.createComment(payload).subscribe({
          next: () => {
            this.snackBar.open('Comment created', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to create comment', 'Close', { duration: 3000 })
        });
      });
  }

  openEditCommentDialog(comment: RatingCommentDto): void {
    if (!comment.ratingCommentId) {
      return;
    }

    this.dialog
      .open(GenericFormDialogComponent<RatingCommentDto>, {
        data: {
          title: 'Edit Rating Comment',
          fields: this.ratingCommentFields,
          initialValue: comment
        }
      })
      .afterClosed()
      .subscribe((value: Partial<RatingCommentDto> | undefined) => {
        if (!value) {
          return;
        }

        const payload: RatingCommentDto = {
          ...comment,
          ...value,
          targetType: 'OUTLET'
        };

        this.ratingService.updateComment(comment.ratingCommentId!, payload).subscribe({
          next: () => {
            this.snackBar.open('Comment updated', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to update comment', 'Close', { duration: 3000 })
        });
      });
  }

  deleteComment(comment: RatingCommentDto): void {
    if (!comment.ratingCommentId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Comment',
          message: 'Are you sure you want to delete this comment?'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.ratingService.deleteComment(comment.ratingCommentId!).subscribe({
          next: () => {
            this.snackBar.open('Comment deleted', 'Close', { duration: 2500 });
            this.loadRatingsAndComments();
          },
          error: () => this.snackBar.open('Failed to delete comment', 'Close', { duration: 3000 })
        });
      });
  }
}

