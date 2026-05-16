import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { UserDto } from './services/user.service';
import { OfferService } from '../admin/offer.service';
import { Offer } from '../admin/offer.service';

export interface UserModalData { user?: UserDto; }

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './user-form-modal.component.html',
  styleUrl:    './user-form-modal.component.scss',
})
export class UserFormModalComponent implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly destroyRef   = inject(DestroyRef);
  private readonly offerService = inject(OfferService);

  readonly isEdit = signal(false);
  readonly offers = signal<Offer[]>([]);

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(255)]],
    email:    ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone:    ['', [Validators.required, Validators.pattern(/^[+0-9\s\-()]{7,20}$/)]],
    offer_id: [null as number | null],
  });

  get title():    string { return this.isEdit() ? `Edit ${this.data?.user?.name ?? 'User'}` : 'Add User'; }
  get subtitle(): string { return this.isEdit() ? 'Update user details' : 'Create a new platform user'; }

  constructor(
    private readonly dialogRef: MatDialogRef<UserFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: UserModalData,
  ) {}

  ngOnInit(): void {
    this.offerService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(offers => this.offers.set(offers.filter(o => o.status === 'active')));

    if (this.data?.user) {
      this.isEdit.set(true);
      const u = this.data.user;
      this.form.patchValue({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '' });
      if (this.isEdit()) {
        this.form.get('email')?.disable();
        this.form.get('phone')?.disable();
      }
    }
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }

  close(): void { this.dialogRef.close(); }
}
