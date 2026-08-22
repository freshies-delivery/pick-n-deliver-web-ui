import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../../core/api.config';

export type OfferType = 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY' | 'BUY_X_GET_Y';

/**
 * Matches the backend OfferDto. Offers are created standalone here; the
 * user/outlet/item target lists stay empty until an offer is assigned later.
 */
export interface Offer {
  offerId: number;
  offerType: OfferType;
  offerName: string;
  offerDescription: string;
  offerCode: string;
  offerDiscount: number;
  offerExpiry: Date | null;
  userIds: number[];
  outletIds: number[];
  itemIds: number[];
}

/** Request body sent to create/update — the OfferDto shape the API expects. */
export interface OfferPayload {
  offerName: string;
  offerCode: string;
  offerDescription: string;
  offerType: OfferType;
  offerDiscount: number;
  offerExpiry: string | null;
  userIds?: number[];
  outletIds?: number[];
  itemIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly endpoint = apiUrl('/api/offers');

  constructor(private readonly http: HttpClient) {}

  /**
   * @param unassignedOnly when true, requests only offers not yet attached to any
   *   user/outlet/item (`?assigned=false`) — used by the admin "create & assign later"
   *   page to avoid fetching the entire offer table.
   */
  list(unassignedOnly = false): Observable<Offer[]> {
    const url = unassignedOnly ? `${this.endpoint}?assigned=false` : this.endpoint;
    return this.http.get<Record<string, unknown>[]>(url).pipe(
      map((data) => (data ?? []).map((raw) => this.map(raw)))
    );
  }

  /** Offers assigned to a specific user. */
  listByUser(userId: number): Observable<Offer[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.endpoint}/user/${userId}`).pipe(
      map((data) => (data ?? []).map((raw) => this.map(raw)))
    );
  }

  /** Offers usable at a specific outlet. */
  listByOutlet(outletId: number): Observable<Offer[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.endpoint}/outlet/${outletId}`).pipe(
      map((data) => (data ?? []).map((raw) => this.map(raw)))
    );
  }

  /** Client-wide offers (usable across all of the client's outlets). */
  listByClient(clientId: number): Observable<Offer[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.endpoint}/client/${clientId}`).pipe(
      map((data) => (data ?? []).map((raw) => this.map(raw)))
    );
  }

  /** Create an offer locked to a single outlet. */
  createForOutlet(outletId: number, body: OfferPayload): Observable<Offer> {
    return this.http.post<Record<string, unknown>>(`${this.endpoint}/outlet/${outletId}`, body).pipe(map(r => this.map(r)));
  }

  /** Create an offer applied to all of the client's current outlets. */
  createForClient(clientId: number, body: OfferPayload): Observable<Offer> {
    return this.http.post<Record<string, unknown>>(`${this.endpoint}/client/${clientId}`, body).pipe(map(r => this.map(r)));
  }

  /** Attach existing offers to an outlet without touching their other assignments. */
  attachToOutlet(outletId: number, offerIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/outlet/${outletId}/attach`, offerIds);
  }

  create(body: OfferPayload): Observable<Offer> {
    return this.http.post<Record<string, unknown>>(this.endpoint, body).pipe(map(r => this.map(r)));
  }

  update(id: number, body: OfferPayload): Observable<Offer> {
    return this.http.put<Record<string, unknown>>(`${this.endpoint}/${id}`, body).pipe(map(r => this.map(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  private map(raw: Record<string, unknown>): Offer {
    const expiry = raw['offerExpiry'] as string | null;
    return {
      offerId: raw['offerId'] as number,
      offerType: (raw['offerType'] as OfferType) ?? 'PERCENTAGE',
      offerName: (raw['offerName'] as string) ?? '',
      offerDescription: (raw['offerDescription'] as string) ?? '',
      offerCode: (raw['offerCode'] as string) ?? '',
      offerDiscount: (raw['offerDiscount'] as number) ?? 0,
      offerExpiry: expiry ? new Date(expiry) : null,
      userIds: (raw['userIds'] as number[]) ?? [],
      outletIds: (raw['outletIds'] as number[]) ?? [],
      itemIds: (raw['itemIds'] as number[]) ?? [],
    };
  }
}
