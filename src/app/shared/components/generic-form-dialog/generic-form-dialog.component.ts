import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type DialogFieldType = 'text' | 'number' | 'textarea' | 'checkbox';

export interface DialogFieldConfig {
  key: string;
  label: string;
  type: DialogFieldType;
  required?: boolean;
}

export interface GenericFormDialogData<T = unknown> {
  title: string;
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
    MatCheckboxModule
  ],
  templateUrl: './generic-form-dialog.component.html',
  styleUrl: './generic-form-dialog.component.css'
})
export class GenericFormDialogComponent<T = unknown> {
  readonly form = new FormGroup<Record<string, FormControl>>({});

  constructor(
    private readonly dialogRef: MatDialogRef<GenericFormDialogComponent<T>>,
    @Inject(MAT_DIALOG_DATA) public readonly data: GenericFormDialogData<T>
  ) {
    const initialValue = (data.initialValue ?? {}) as Record<string, unknown>;

    for (const field of data.fields) {
      const initial = initialValue[field.key] ?? (field.type === 'checkbox' ? false : '');
      this.form.addControl(
        field.key,
        new FormControl(initial, field.required ? Validators.required : null)
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
}



