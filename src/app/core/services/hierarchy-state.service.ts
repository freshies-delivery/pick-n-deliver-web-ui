import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface HierarchyState {
  clientId: number | null;
  outletId: number | null;
  categoryId: number | null;
  clientName: string | null;
  outletName: string | null;
  categoryName: string | null;
}

const initialState: HierarchyState = {
  clientId: null,
  outletId: null,
  categoryId: null,
  clientName: null,
  outletName: null,
  categoryName: null
};

@Injectable({ providedIn: 'root' })
export class HierarchyStateService {
  private readonly stateSubject = new BehaviorSubject<HierarchyState>(initialState);
  readonly hierarchy$ = this.stateSubject.asObservable();

  get state(): HierarchyState {
    return this.stateSubject.value;
  }

  setClient(clientId: number | null, clientName: string | null = null): void {
    this.stateSubject.next({
      ...this.state,
      clientId,
      clientName,
      outletId: null,
      outletName: null,
      categoryId: null,
      categoryName: null
    });
  }

  setOutlet(outletId: number | null, outletName: string | null = null): void {
    this.stateSubject.next({
      ...this.state,
      outletId,
      outletName,
      categoryId: null,
      categoryName: null
    });
  }

  setCategory(categoryId: number | null, categoryName: string | null = null): void {
    this.stateSubject.next({
      ...this.state,
      categoryId,
      categoryName
    });
  }

  syncFromRoute(snapshot: ActivatedRouteSnapshot): void {
    const mergedParams = this.collectParams(snapshot);
    const clientId = this.toNumber(mergedParams['clientId']);
    const outletId = this.toNumber(mergedParams['outletId']);
    const categoryId = this.toNumber(mergedParams['categoryId']);

    this.stateSubject.next({
      ...this.state,
      clientId,
      outletId,
      categoryId,
      outletName: outletId ? this.state.outletName : null,
      categoryName: categoryId ? this.state.categoryName : null,
      clientName: clientId ? this.state.clientName : null
    });
  }

  private collectParams(snapshot: ActivatedRouteSnapshot): Record<string, string> {
    const params: Record<string, string> = {};
    let current: ActivatedRouteSnapshot | null = snapshot;

    while (current) {
      Object.assign(params, current.params);
      current = current.parent;
    }

    return params;
  }

  private toNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}

