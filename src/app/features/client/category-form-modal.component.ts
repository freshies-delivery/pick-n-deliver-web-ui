import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ImageSearchComponent } from '../../shared/components/image-search/image-search.component';
import { SegmentService, Segment } from '../admin/segment.service';
import { CategoryDto } from './services/category.service';

export interface CategoryModalData {
  outletId?: number;
  outletName?: string;
  category?: CategoryDto;
}

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ImageSearchComponent, ReactiveFormsModule],
  templateUrl: './category-form-modal.component.html',
  styleUrl:    './category-form-modal.component.scss',
})
export class CategoryFormModalComponent implements OnInit {
  private readonly fb       = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly segmentService = inject(SegmentService);

  readonly segments = signal<Segment[]>([]);
  readonly isEdit   = signal(false);

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(255)],
    segment_id:  [null as number | null],
    image_url:   [''],
  });

  get title(): string {
    return this.isEdit() ? `Edit ${this.data?.category?.name ?? 'Category'}` : 'Add Category';
  }

  get subtitle(): string {
    const name = this.data?.outletName ?? '';
    return name ? `${this.isEdit() ? 'Editing' : 'Adding'} category for ${name}` : '';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<CategoryFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: CategoryModalData,
  ) {}

  ngOnInit(): void {
    this.segmentService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(s => this.segments.set(s));

    if (this.data?.category) {
      this.isEdit.set(true);
      const c = this.data.category;
      this.form.patchValue({
        name:        c.name        ?? '',
        description: c.description ?? '',
        image_url:   '',
      });
    }
  }

  onImage(url: string): void  { this.form.patchValue({ image_url: url }); }
  clearImage(): void          { this.form.patchValue({ image_url: '' }); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
