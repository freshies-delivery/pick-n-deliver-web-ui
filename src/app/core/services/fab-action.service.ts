import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FabActionService {
  private readonly showFabSubject = new BehaviorSubject(false);
  readonly showFab$ = this.showFabSubject.asObservable();

  private readonly actionSubject = new BehaviorSubject<(() => void) | null>(null);
  readonly action$ = this.actionSubject.asObservable();

  private readonly actionsByKey = new Map<string, () => void>();

  setFabAction(action: () => void): void {
    this.actionSubject.next(action);
  }

  clearFabAction(): void {
    this.actionSubject.next(null);
  }

  registerAction(key: string, action: () => void): void {
    this.actionsByKey.set(key, action);
  }

  unregisterAction(key: string): void {
    this.actionsByKey.delete(key);
    if (!this.actionsByKey.has(key)) {
      this.clearFabAction();
    }
  }

  configure(showFab: boolean, fabActionKey?: string): void {
    this.showFabSubject.next(showFab);

    if (!showFab) {
      this.clearFabAction();
      return;
    }

    if (fabActionKey) {
      const action = this.actionsByKey.get(fabActionKey) ?? null;
      this.actionSubject.next(action);
    }
  }

  trigger(): void {
    this.actionSubject.value?.();
  }
}

