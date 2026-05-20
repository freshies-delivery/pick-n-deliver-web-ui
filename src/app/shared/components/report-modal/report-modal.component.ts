import {
  Component, Inject, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface ReportModalData {
  type: 'client' | 'outlet' | 'user' | 'location';
  entityId?: number;
  label: string;
  locationIds?: number[];
}

interface PeriodOption { label: string; days: number; }

const PERIODS: PeriodOption[] = [
  { label: '7 days',    days: 7 },
  { label: '30 days',   days: 30 },
  { label: '90 days',   days: 90 },
  { label: '6 months',  days: 180 },
  { label: '12 months', days: 365 },
];

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-modal.component.html',
  styleUrl:    './report-modal.component.scss',
})
export class ReportModalComponent {
  readonly periods = PERIODS;
  readonly selectedDays  = signal(30);
  readonly selectedFormat = signal<'excel' | 'pdf'>('excel');
  readonly downloading   = signal(false);
  readonly error         = signal<string | null>(null);

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      client: 'Client', outlet: 'Outlet', user: 'User', location: 'Location',
    };
    return map[this.data.type] ?? 'Report';
  });

  readonly selectedPeriodLabel = computed(() =>
    PERIODS.find(p => p.days === this.selectedDays())?.label ?? `${this.selectedDays()} days`
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ReportModalData,
    private readonly dialogRef: MatDialogRef<ReportModalComponent>,
    private readonly http: HttpClient,
  ) {}

  selectPeriod(days: number): void { this.selectedDays.set(days); }
  selectFormat(f: 'excel' | 'pdf'): void { this.selectedFormat.set(f); }

  download(): void {
    this.error.set(null);
    this.downloading.set(true);

    let params = new HttpParams()
      .set('reportType', this.data.type)
      .set('periodDays', String(this.selectedDays()))
      .set('format', this.selectedFormat());

    if (this.data.entityId) {
      params = params.set('entityId', String(this.data.entityId));
    }
    if (this.data.locationIds?.length) {
      this.data.locationIds.forEach(id => { params = params.append('locationIds', String(id)); });
    }

    this.http.get(apiUrl('/api/dashboard/reports'), {
      params,
      responseType: 'blob',
      observe: 'response',
    }).pipe(finalize(() => this.downloading.set(false)))
      .subscribe({
        next: response => {
          const blob = response.body!;
          const ext  = this.selectedFormat() === 'pdf' ? 'pdf' : 'xlsx';
          const cd   = response.headers.get('content-disposition') ?? '';
          const match = cd.match(/filename="?([^";\n]+)"?/);
          const filename = match?.[1] ?? `report-${this.data.type}-${Date.now()}.${ext}`;
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('Failed to generate report. Please try again.'),
      });
  }

  close(): void { this.dialogRef.close(); }
}
