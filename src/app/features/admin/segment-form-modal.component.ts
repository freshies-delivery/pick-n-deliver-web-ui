import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { Segment } from './segment.service';
import { AppDashService } from '../../core/services/app-dash.service';

export interface SegmentModalData { segment?: Record<string, unknown>; }

@Component({
  selector: 'app-segment-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './segment-form-modal.component.html',
  styleUrl:    './segment-form-modal.component.scss',
})
export class SegmentFormModalComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly dashService = inject(AppDashService);

  readonly isEdit   = signal(false);
  readonly segments = signal<Segment[]>([]);

  readonly form = this.fb.group({
    name:         ['', [Validators.required, Validators.maxLength(255)]],
    description:  ['', Validators.maxLength(500)],
    segment_uri:  [''],
    priority:     [0, [Validators.min(0)]],
    parent_id:    [null as string | null],
    criteria:     [''],
  });

  get title():    string { return this.isEdit() ? 'Edit Segment' : 'Create Segment'; }
  get subtitle(): string { return this.isEdit() ? 'Update segment details' : 'Define a new audience segment'; }

  constructor(
    private readonly dialogRef: MatDialogRef<SegmentFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: SegmentModalData,
  ) {}

  ngOnInit(): void {
    this.dashService.getSegments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segs: any[]) => {
        const excludeId = this.data?.segment
          ? String((this.data.segment as any)['segmentId'] ?? (this.data.segment as any)['id'] ?? '')
          : null;
        const mapped: Segment[] = (segs ?? [])
          .filter((s: any) => !excludeId || String(s.segmentId) !== excludeId)
          .map((s: any) => ({
            id: String(s.segmentId), name: s.name, description: s.description ?? '',
            criteria: '', criteriaReadable: '', userCount: s.clientCount ?? 0,
            isActive: true, createdAt: new Date(), color: '#6366F1',
          }));
        this.segments.set(mapped);
      });

    this.form.get('name')!.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        if (name && !this.form.get('segment_uri')!.dirty) {
          this.form.patchValue(
            { segment_uri: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
            { emitEvent: false }
          );
        }
      });

    if (this.data?.segment) {
      this.isEdit.set(true);
      const s = this.data.segment;
      this.form.patchValue({
        name:        (s['name'] as string) ?? '',
        description: (s['description'] as string) ?? '',
        criteria:    (s['criteria'] as string) ?? '',
      });
    }
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
