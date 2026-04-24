import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface UserContextState {
  userId: number | null;
  userName: string | null;
}

const initialState: UserContextState = {
  userId: null,
  userName: null
};

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly stateSubject = new BehaviorSubject<UserContextState>(initialState);
  readonly user$ = this.stateSubject.asObservable();

  get state(): UserContextState {
    return this.stateSubject.value;
  }

  setUser(userId: number | null, userName: string | null = null): void {
    this.stateSubject.next({ userId, userName });
  }

  syncFromRoute(snapshot: ActivatedRouteSnapshot): void {
    const mergedParams = this.collectParams(snapshot);
    const userId = this.toNumber(mergedParams['userId']);

    this.stateSubject.next({
      userId,
      userName: userId === this.state.userId ? this.state.userName : null
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

