import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

let _id = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = computed(() => this._toasts());

  success(title: string, message?: string): void { this.show('success', title, message); }
  error(title: string, message?: string):   void { this.show('error',   title, message); }
  warning(title: string, message?: string): void { this.show('warning', title, message); }
  info(title: string, message?: string):    void { this.show('info',    title, message); }

  private show(type: ToastType, title: string, message?: string): void {
    const id = ++_id;
    this._toasts.update(t => [...t, { id, type, title, message }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  dismiss(id: number): void {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
