import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { apiUrl } from '../../core/api.config';

export interface Offer {
  id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap: number;
  applicableCategories: string[];
  startDate: Date;
  endDate: Date;
  usageCount: number;
  usageLimit: number;
  status: 'active' | 'expired' | 'scheduled';
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly endpoint = apiUrl('/api/offers');

  constructor(private readonly http: HttpClient) {}

  create(body: Record<string, unknown>): Observable<Offer> {
    return this.http.post<Record<string, unknown>>(this.endpoint, body).pipe(map(r => this.map(r)));
  }

  update(id: string, body: Record<string, unknown>): Observable<Offer> {
    return this.http.put<Record<string, unknown>>(`${this.endpoint}/${id}`, body).pipe(map(r => this.map(r)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  list(): Observable<Offer[]> {
    // TODO: Replace with real endpoint once API contract is defined.
    // Mock: public/mock/offers.json
    return this.http.get<Record<string, unknown>[]>('mock/offers.json').pipe(
      delay(400),
      map((data) => data.map((raw) => this.map(raw)))
    );
  }

  private map(raw: Record<string, unknown>): Offer {
    return {
      id: raw['id'] as string,
      name: raw['name'] as string,
      code: raw['code'] as string,
      discountType: raw['discount_type'] as 'percentage' | 'flat',
      discountValue: raw['discount_value'] as number,
      minOrderValue: raw['min_order_value'] as number,
      maxDiscountCap: raw['max_discount_cap'] as number,
      applicableCategories: raw['applicable_categories'] as string[],
      startDate: new Date(raw['start_date'] as string),
      endDate: new Date(raw['end_date'] as string),
      usageCount: raw['usage_count'] as number,
      usageLimit: raw['usage_limit'] as number,
      status: raw['status'] as 'active' | 'expired' | 'scheduled',
      createdAt: new Date(raw['created_at'] as string)
    };
  }
}
