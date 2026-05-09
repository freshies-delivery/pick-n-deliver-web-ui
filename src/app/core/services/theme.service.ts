import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'swiftly_theme';

  currentTheme = signal<Theme>(this.loadTheme());

  constructor() {
    effect(() => {
      this.applyTheme(this.currentTheme());
      localStorage.setItem(this.STORAGE_KEY, this.currentTheme());
    });
  }

  toggle(): void {
    this.currentTheme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
