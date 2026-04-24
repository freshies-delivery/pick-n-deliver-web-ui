import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

export type DialogFieldType = 'text' | 'number' | 'textarea' | 'checkbox' | 'toggle';

export interface DialogFieldConfig {
  key: string;
  label: string;
  type: DialogFieldType;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export interface GenericFormDialogData<T = unknown> {
  title: string;
  subtitle?: string;
  fields: DialogFieldConfig[];
  initialValue?: Partial<T>;
}

@Component({
  selector: 'app-generic-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  templateUrl: './generic-form-dialog.component.html',
  styleUrl: './generic-form-dialog.component.scss'
})
export class GenericFormDialogComponent<T = unknown> {
  readonly form = new FormGroup<Record<string, FormControl>>({});
  private readonly numberPattern = /^\d+(\.\d+)?$/;

  constructor(
    private readonly dialogRef: MatDialogRef<GenericFormDialogComponent<T>>,
    @Inject(MAT_DIALOG_DATA) public readonly data: GenericFormDialogData<T>
  ) {
    const initialValue = (data.initialValue ?? {}) as Record<string, unknown>;

    for (const field of data.fields) {
      const initial = initialValue[field.key] ?? (field.type === 'checkbox' || field.type === 'toggle' ? false : '');
      const validators: ValidatorFn[] = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'number') {
        validators.push(Validators.pattern(this.numberPattern));
      }
      this.form.addControl(
        field.key,
        new FormControl(initial, validators)
      );
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid number';
    }
    return '';
  }
}



