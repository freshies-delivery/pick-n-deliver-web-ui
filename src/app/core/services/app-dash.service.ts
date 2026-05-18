import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl + '/dashboard';

@Injectable({ providedIn: 'root' })
export class AppDashService {
  private readonly http = inject(HttpClient);

  // GLOBAL DASHBOARD
  getGlobalStats(locationIds?: number[]): Observable<any> {
    let p = new HttpParams();
    if (locationIds && locationIds.length > 0) {
      locationIds.forEach(id => p = p.append('locationIds', String(id)));
    }
    return this.http.get<any>(`${BASE}/stats`, { params: p });
  }

  // CLIENTS
  getClients(page = 0, size = 20, locationIds?: number[], search?: string): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (search) p = p.set('search', search);
    if (locationIds && locationIds.length > 0) {
      locationIds.forEach(id => p = p.append('locationIds', String(id)));
    }
    return this.http.get<any>(`${BASE}/clients`, { params: p });
  }
  getClient(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/${id}`);
  }
  getClientStats(): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/stats`);
  }
  createClient(dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/clients`, dto);
  }
  updateClient(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/clients/${id}`, dto);
  }
  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/clients/${id}`);
  }

  // OUTLETS
  getOutlets(clientId?: number, page = 0, size = 20, locationIds?: number[], search?: string): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (clientId)   p = p.set('clientId', clientId);
    if (search)     p = p.set('search', search);
    if (locationIds && locationIds.length > 0) {
      locationIds.forEach(id => p = p.append('locationIds', String(id)));
    }
    return this.http.get<any>(`${BASE}/outlets`, { params: p });
  }
  createOutlet(dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/outlets`, dto);
  }
  updateOutlet(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/outlets/${id}`, dto);
  }
  deleteOutlet(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/outlets/${id}`);
  }

  // OUTLET ADDRESS
  getOutletAddress(outletId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/address`);
  }
  upsertOutletAddress(outletId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/outlets/${outletId}/address`, dto);
  }
  updateOutletAddress(outletId: number, addressId: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/outlets/${outletId}/address/${addressId}`, dto);
  }
  deleteOutletAddress(outletId: number, addressId: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/outlets/${outletId}/address/${addressId}`);
  }

  // CATEGORIES
  getCategories(outletId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/categories`);
  }
  createCategory(outletId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/outlets/${outletId}/categories`, dto);
  }
  updateCategory(outletId: number, id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/outlets/${outletId}/categories/${id}`, dto);
  }
  deleteCategory(outletId: number, id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/outlets/${outletId}/categories/${id}`);
  }

  // ITEMS
  getItems(outletId: number, categoryId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/categories/${categoryId}/items`);
  }
  createItem(outletId: number, categoryId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/outlets/${outletId}/categories/${categoryId}/items`, dto);
  }
  updateItem(outletId: number, categoryId: number, id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/outlets/${outletId}/categories/${categoryId}/items/${id}`, dto);
  }
  toggleItemAvailability(outletId: number, categoryId: number, id: number, available: boolean): Observable<any> {
    return this.http.patch<any>(
      `${BASE}/outlets/${outletId}/categories/${categoryId}/items/${id}/availability`,
      null, { params: { available } }
    );
  }
  deleteItem(outletId: number, categoryId: number, id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/outlets/${outletId}/categories/${categoryId}/items/${id}`);
  }

  // RATINGS
  getRatings(outletId: number, page = 0, size = 10): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/ratings`, { params: { page, size } });
  }
  getRatingSummary(outletId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/ratings/summary`);
  }
  createRating(outletId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/outlets/${outletId}/ratings`, dto);
  }
  deleteRating(outletId: number, id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/outlets/${outletId}/ratings/${id}`);
  }

  // OUTLET DASHBOARD
  getOutletDashboard(outletId: number, range = 'today'): Observable<any> {
    return this.http.get<any>(`${BASE}/outlets/${outletId}/dashboard`, { params: { range } });
  }

  // SEGMENTS
  getSegments(): Observable<any> {
    return this.http.get<any>(`${BASE}/segments`);
  }
  createSegment(dto: any): Observable<any> {
    return this.http.post<any>(`${BASE}/segments`, dto);
  }
  updateSegment(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${BASE}/segments/${id}`, dto);
  }
  deleteSegment(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/segments/${id}`);
  }
  reorderSegments(updates: { segmentId: number; priority: number }[]): Observable<any> {
    return this.http.put<any>(`${BASE}/segments/reorder`, updates);
  }
  assignClientToSegment(segmentId: number, clientId: number): Observable<any> {
    return this.http.put<any>(`${BASE}/segments/${segmentId}/clients/${clientId}`, null);
  }

  // CLIENT DETAIL
  getClientDetail(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/${id}`);
  }
  getClientDashboard(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/${id}/dashboard`);
  }
  getClientOrders(id: number, page = 0, size = 20, status?: string, outletId?: number): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (status)   p = p.set('status', status);
    if (outletId) p = p.set('outletId', outletId);
    return this.http.get<any>(`${BASE}/clients/${id}/orders`, { params: p });
  }
  getClientRatings(id: number, page = 0, size = 20, outletId?: number, score?: number): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (outletId) p = p.set('outletId', outletId);
    if (score)    p = p.set('score', score);
    return this.http.get<any>(`${BASE}/clients/${id}/ratings`, { params: p });
  }
  getClientRatingSummary(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/${id}/ratings/summary`);
  }
  getClientAnalytics(id: number, range = '7d'): Observable<any> {
    return this.http.get<any>(`${BASE}/clients/${id}/analytics`, { params: { range } });
  }

  // USERS
  getUsers(page = 0, size = 20, search?: string): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (search) p = p.set('search', search);
    return this.http.get<any>(`${BASE}/users`, { params: p });
  }
  getUserDetail(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/users/${id}`);
  }
  getUserDashboard(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/users/${id}/dashboard`);
  }
  getUserOrders(id: number, page = 0, size = 20, status?: string): Observable<any> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (status) p = p.set('status', status);
    return this.http.get<any>(`${BASE}/users/${id}/orders`, { params: p });
  }
  getUserRatings(id: number, page = 0, size = 10): Observable<any> {
    return this.http.get<any>(`${BASE}/users/${id}/ratings`, { params: { page, size } });
  }
}
