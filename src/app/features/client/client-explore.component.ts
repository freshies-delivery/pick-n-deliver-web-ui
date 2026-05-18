import {
  Component, ChangeDetectionStrategy, inject, signal, DestroyRef
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppDashService } from '../../core/services/app-dash.service';
import { HierarchyStateService } from '../../core/services/hierarchy-state.service';

@Component({
  selector: 'app-client-explore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './client-explore.component.html',
  styleUrl: './client-explore.component.scss',
})
export class ClientExploreComponent {
  readonly mode          = signal<'client' | 'outlet'>('outlet');
  readonly searchQuery   = signal('');
  readonly suggestions   = signal<any[]>([]);
  readonly searchLoading = signal(false);
  readonly searchFocused = signal(false);
  readonly showSuggestions = signal(false);

  private readonly searchSubject$ = new Subject<string>();
  private readonly dashService    = inject(AppDashService);
  private readonly hierService    = inject(HierarchyStateService);
  private readonly router         = inject(Router);
  private readonly destroyRef     = inject(DestroyRef);

  constructor() {
    this.searchSubject$.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) {
          this.searchLoading.set(false);
          this.suggestions.set([]);
          this.showSuggestions.set(false);
          return EMPTY;
        }
        const call = this.mode() === 'client'
          ? this.dashService.getClients(0, 10, undefined, q)
          : this.dashService.getOutlets(undefined, 0, 10, undefined, q);
        return call.pipe(finalize(() => this.searchLoading.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      const list = Array.isArray(res) ? res : (res?.content ?? []);
      this.suggestions.set(list);
      this.showSuggestions.set(list.length > 0);
    });
  }

  setMode(m: 'client' | 'outlet'): void {
    this.mode.set(m);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    if (this.searchQuery().trim()) {
      this.searchSubject$.next(this.searchQuery());
    }
  }

  onInput(value: string): void {
    this.searchQuery.set(value);
    if (value.trim()) {
      this.searchLoading.set(true);
    } else {
      this.searchLoading.set(false);
      this.suggestions.set([]);
      this.showSuggestions.set(false);
    }
    this.searchSubject$.next(value);
  }

  onFocus(): void {
    this.searchFocused.set(true);
    if (this.suggestions().length > 0) this.showSuggestions.set(true);
  }

  onBlur(): void {
    setTimeout(() => {
      this.searchFocused.set(false);
      this.showSuggestions.set(false);
    }, 200);
  }

  clear(): void {
    this.searchQuery.set('');
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.searchSubject$.next('');
  }

  selectClient(c: any): void {
    if (!c.clientId) return;
    this.showSuggestions.set(false);
    this.hierService.setClient(c.clientId, c.name);
    this.router.navigate(['/dashboard/clients', c.clientId, 'dashboard']);
  }

  selectOutlet(o: any): void {
    if (!o.clientId || !o.outletId) return;
    this.showSuggestions.set(false);
    this.hierService.setClient(o.clientId, o.clientName ?? '');
    this.hierService.setOutlet(o.outletId, o.name);
    this.router.navigate(['/dashboard/clients', o.clientId, 'outlets', o.outletId]);
  }

  initials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  highlight(text: string, q: string): string {
    if (!q.trim() || !text) return text ?? '';
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${esc})`, 'gi'), '<mark class="hl">$1</mark>');
  }
}
