import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="swiftly-toast" [class]="'toast-' + toast.type" (click)="toastService.dismiss(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8l4 4 6-6"/></svg>
              }
              @case ('error') {
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2l6 12H2L8 2z"/><path d="M8 7v3M8 12v.5"/></svg>
              }
              @default {
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5"/></svg>
              }
            }
          </div>
          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-message">{{ toast.message }}</div>
            }
          </div>
          <button class="toast-close" type="button">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 9999; pointer-events: none;
    }

    .swiftly-toast {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 12px;
      background: #0E0F19; border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      min-width: 280px; max-width: 380px;
      pointer-events: all; cursor: pointer;
      animation: toastIn 0.25s ease-out;
      border-left: 3px solid;

      &.toast-success { border-left-color: #22C55E; .toast-icon { color: #22C55E; } }
      &.toast-error   { border-left-color: #EF4444; .toast-icon { color: #EF4444; } }
      &.toast-warning { border-left-color: #F59E0B; .toast-icon { color: #F59E0B; } }
      &.toast-info    { border-left-color: #6366F1; .toast-icon { color: #818CF8; } }
    }

    .toast-icon {
      flex-shrink: 0; width: 18px; height: 18px; margin-top: 1px;
      svg { width: 100%; height: 100%; }
    }

    .toast-body { flex: 1; min-width: 0; }

    .toast-title {
      font-size: 13px; font-weight: 600; color: #E2E8F0; line-height: 1.4;
    }

    .toast-message {
      font-size: 12px; color: #94A3B8; margin-top: 2px; line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0; width: 18px; height: 18px; color: #64748B;
      background: none; border: none; cursor: pointer; padding: 0; margin-top: 2px;
      &:hover { color: #CBD5E1; }
      svg { width: 100%; height: 100%; }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class ToastOutletComponent {
  readonly toastService = inject(ToastService);
}
