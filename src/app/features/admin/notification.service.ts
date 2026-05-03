import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  channel: 'push' | 'sms' | 'email';
  targetType: 'all' | 'segment';
  targetLabel: string;
  sentCount: number;
  openCount: number;
  openRate: number;
  status: 'sent' | 'scheduled';
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdBy: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<NotificationEntry[]> {
    // TODO: Replace with real endpoint once API contract is defined.
    // Mock: public/mock/notifications.json
    return this.http.get<Record<string, unknown>[]>('mock/notifications.json').pipe(
      delay(400),
      map((data) => data.map((raw) => this.map(raw)))
    );
  }

  private map(raw: Record<string, unknown>): NotificationEntry {
    return {
      id: raw['id'] as string,
      title: raw['title'] as string,
      message: raw['message'] as string,
      channel: raw['channel'] as 'push' | 'sms' | 'email',
      targetType: raw['target_type'] as 'all' | 'segment',
      targetLabel: raw['target_label'] as string,
      sentCount: raw['sent_count'] as number,
      openCount: raw['open_count'] as number,
      openRate: raw['open_rate'] as number,
      status: raw['status'] as 'sent' | 'scheduled',
      scheduledAt: raw['scheduled_at'] ? new Date(raw['scheduled_at'] as string) : null,
      sentAt: raw['sent_at'] ? new Date(raw['sent_at'] as string) : null,
      createdBy: raw['created_by'] as string
    };
  }
}
