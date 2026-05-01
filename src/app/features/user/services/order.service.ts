import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../../../core/api.config';

export interface OrderItemDto {
  orderItemId?: number;
  orderId?: number;
  itemId?: number;
  quantity?: number;
  unitPrice?: number;
}

export interface OrderDto {
  orderId?: number;
  type?: string;
  status?: string;
  totalAmount?: number;
  outletId?: number;
  userId?: number;
  deliveryPartnerId?: number;
  orderItems?: OrderItemDto[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly endpoint = apiUrl('/api/orders');

  constructor(private readonly http: HttpClient) {}

  list(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(this.endpoint);
  }

  listForUser(userId: number): Observable<OrderDto[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<OrderDto[]>(this.endpoint, { params }).pipe(
      map((orders) => orders.filter((o) => o.userId === userId))
    );
  }

  get(id: number): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.endpoint}/${id}`);
  }
}

