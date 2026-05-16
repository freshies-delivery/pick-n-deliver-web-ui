import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from '../modal/modal.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  template: `
    <app-modal
      [title]="data.title"
      size="sm"
      [hasIcon]="true"
      (closeRequested)="cancel()">

      <svg icon viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 3L2 17h16L10 3z"/>
        <path d="M10 8v4M10 14h.01"/>
      </svg>

      <p class="confirm-msg">{{ data.message }}</p>

      <button footer
        [class]="data.isDestructive !== false ? 'btn-danger-save' : 'btn-save'"
        type="button"
        (click)="confirm()">
        {{ data.confirmText ?? 'Delete' }}
      </button>
    </app-modal>
  `,
  styles: [`
    .confirm-msg {
      margin: 0;
      font-size: 13px;
      color: #8888BB;
      line-height: 1.6;
    }
  `],
})
export class ConfirmDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData,
  ) {}

  confirm(): void { this.dialogRef.close(true); }
  cancel():  void { this.dialogRef.close(false); }
}
