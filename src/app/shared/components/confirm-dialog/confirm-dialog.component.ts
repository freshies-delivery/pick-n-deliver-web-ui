import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon" [class.destructive]="data.isDestructive !== false">
        <mat-icon>{{ data.isDestructive !== false ? 'warning' : 'info' }}</mat-icon>
      </div>

      <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      <mat-dialog-content class="dialog-message">{{ data.message }}</mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="cancel()" class="cancel-btn">
          {{ data.cancelText ?? 'Cancel' }}
        </button>
        <button
          mat-flat-button
          (click)="confirm()"
          class="confirm-btn"
        >
          {{ data.confirmText ?? 'Delete' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      text-align: center;
      padding: 16px 0;
    }

    .dialog-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;

      mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        padding: 10px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.08);
        color: #111827;
      }

      &.destructive mat-icon {
        background-color: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }
    }

    .dialog-title {
      margin: 0 16px 8px 16px;
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }

    .dialog-message {
      padding: 0 16px 18px 16px;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }

    .dialog-actions {
      padding: 16px;
      gap: 12px;

      .cancel-btn {
        color: #6b7280;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      }

      .confirm-btn {
        min-width: 100px;
        background: #000;
        color: #fff;

        &:hover {
          background: #1f1f1f;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
