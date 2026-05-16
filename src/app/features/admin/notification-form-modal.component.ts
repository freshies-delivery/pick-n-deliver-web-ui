import {
  Component, Inject, Optional, OnInit,
  ChangeDetectionStrategy, signal, DestroyRef, inject
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SegmentService, Segment } from './segment.service';

const TITLE_MAX   = 255;
const MESSAGE_MAX = 2000;
const WARN_AT     = 1900;

const CHANNELS = [
  { value: 'PUSH',   label: 'Push' },
  { value: 'SMS',    label: 'SMS' },
  { value: 'EMAIL',  label: 'Email' },
  { value: 'IN_APP', label: 'In-App' },
];

@Component({
  selector: 'app-notification-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './notification-form-modal.component.html',
  styleUrl:    './notification-form-modal.component.scss',
})
export class NotificationFormModalComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly segmentService = inject(SegmentService);

  readonly segments    = signal<Segment[]>([]);
  readonly titleLen    = signal(0);
  readonly messageLen  = signal(0);
  readonly titleMax    = TITLE_MAX;
  readonly messageMax  = MESSAGE_MAX;
  readonly warnAt      = WARN_AT;
  readonly channels    = CHANNELS;

  readonly form = this.fb.group({
    title:             ['', [Validators.required, Validators.maxLength(TITLE_MAX)]],
    message:           ['', [Validators.required, Validators.maxLength(MESSAGE_MAX)]],
    notification_type: ['PUSH'],
    target_type:       ['ALL'],
    segment_id:        [null as string | null],
    schedule_at:       [''],
  });

  get title():    string { return 'Send Notification'; }
  get subtitle(): string { return 'Compose and send a message to your users'; }
  get isSegment(): boolean { return this.form.get('target_type')?.value === 'segment'; }
  get isSMS():     boolean { return this.form.get('notification_type')?.value === 'SMS'; }
  get previewTitle():   string { return this.form.get('title')?.value   || 'Notification title'; }
  get previewMessage(): string { return this.form.get('message')?.value || 'Your message will appear here…'; }
  get isPush(): boolean {
    const t = this.form.get('notification_type')?.value;
    return t === 'PUSH' || t === 'IN_APP';
  }

  constructor(
    private readonly dialogRef: MatDialogRef<NotificationFormModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: unknown,
  ) {}

  ngOnInit(): void {
    this.segmentService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.segments.set(s));

    this.form.get('title')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.titleLen.set((v ?? '').length));

    this.form.get('message')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.messageLen.set((v ?? '').length));
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  close(): void { this.dialogRef.close(); }
}
