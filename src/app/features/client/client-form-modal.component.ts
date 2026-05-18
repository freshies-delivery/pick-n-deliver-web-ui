import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ImageSearchComponent } from '../../shared/components/image-search/image-search.component';
import { Segment } from '../admin/segment.service';
import { AppDashService } from '../../core/services/app-dash.service';
import { ClientDto } from './services/client.service';

export interface ClientModalData { client?: ClientDto; }

@Component({
  selector: 'app-client-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ImageSearchComponent, ReactiveFormsModule],
  templateUrl: './client-form-modal.component.html',
  styleUrl:    './client-form-modal.component.scss',
})
export class ClientFormModalComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly dashService = inject(AppDashService);

  readonly segments = signal<Segment[]>([]);
  readonly isEdit   = signal(false);

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(255)],
    segment_id:  [null as number | null],
    image_url:   [''],
  });

  get title():    string { return this.isEdit() ? `Edit ${this.data?.client?.name ?? 'Client'}` : 'Add Client'; }
  get subtitle(): string { return this.isEdit() ? 'Update client details' : 'Add a new client to the platform'; }

  constructor(
    private readonly dialogRef: MatDialogRef<ClientFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: ClientModalData,
  ) {}

  ngOnInit(): void {
    this.dashService.getSegments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segs: any[]) => {
        const mapped: Segment[] = (segs ?? []).map((s: any, i: number) => ({
          id: String(s.segmentId), name: s.name, description: s.description ?? '',
          criteria: '', criteriaReadable: '', userCount: s.clientCount ?? 0,
          isActive: true, createdAt: new Date(), color: '#6366F1',
        }));
        this.segments.set(mapped);
      });
    if (this.data?.client) {
      this.isEdit.set(true);
      const c = this.data.client;
      this.form.patchValue({ name: c.name, description: c.description ?? '' });
    }
  }

  onImage(url: string): void { this.form.patchValue({ image_url: url }); }
  clearImage(): void          { this.form.patchValue({ image_url: '' }); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
