import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  type: 'number' | 'boolean' | 'string';
  description: string;
  group: string;
  lastUpdated: Date;
  updatedBy: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ConfigEntry[]> {
    // TODO: Replace with real endpoint once API contract is defined.
    // Mock: public/mock/config.json
    return this.http.get<Record<string, unknown>[]>('mock/config.json').pipe(
      delay(400),
      map((data) => data.map((raw) => this.map(raw)))
    );
  }

  private map(raw: Record<string, unknown>): ConfigEntry {
    return {
      id: raw['id'] as string,
      key: raw['key'] as string,
      value: raw['value'] as string,
      type: raw['type'] as 'number' | 'boolean' | 'string',
      description: raw['description'] as string,
      group: raw['group'] as string,
      lastUpdated: new Date(raw['last_updated'] as string),
      updatedBy: raw['updated_by'] as string
    };
  }
}
