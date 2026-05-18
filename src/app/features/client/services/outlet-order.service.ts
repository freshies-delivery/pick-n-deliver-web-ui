import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface OutletOrderItemDto {
  orderItemId?: number;
  orderId?: number;
  itemId?: number;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface OutletOrderDto {
  orderId?: number;
  type?: string;
  status?: string;
  totalAmount?: number;
  taxDetails?: string;
  requestBag?: boolean;
  notes?: string;
  outletId?: number;
  userId?: number;
  deliveryPartnerId?: number;
  userAddressId?: number;
  offerId?: number;
  segmentId?: number;
  segmentName?: string;
  orderItems?: OutletOrderItemDto[];
}

@Injectable({ providedIn: 'root' })
export class OutletOrderService {
  private readonly endpoint = apiUrl('/api/orders');

  constructor(private readonly http: HttpClient) {}

  listByOutlet(outletId: number, page = 0, size = 50): Observable<OutletOrderDto[]> {
    const params = new HttpParams()
      .set('outletId', String(outletId))
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<OutletOrderDto[]>(this.endpoint, { params });
  }

  create(payload: OutletOrderDto): Observable<OutletOrderDto> {
    return this.http.post<OutletOrderDto>(this.endpoint, payload);
  }

  update(id: number, payload: Partial<OutletOrderDto>): Observable<OutletOrderDto> {
    return this.http.put<OutletOrderDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
