import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageToolbarComponent } from '../../shared/components/page-toolbar/page-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { ConfigEntry, ConfigService } from './config.service';

@Component({
  selector: 'app-config-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    PageToolbarComponent,
    SkeletonListComponent,
    FormsModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './config-page.component.html',
  styleUrl: './config-page.component.scss'
})
export class ConfigPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly entries = signal<ConfigEntry[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly searchQuery = signal('');
  editValue = '';

  readonly filteredEntries = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.entries().filter(e =>
      !q ||
      e.key.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.group.toLowerCase().includes(q)
    );
  });

  constructor(private readonly configService: ConfigService) {}

  ngOnInit(): void {
    this.configService.list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => this.entries.set(entries)
      });
  }

  get groups(): string[] {
    return [...new Set(this.filteredEntries().map((e) => e.group))];
  }

  entriesForGroup(group: string): ConfigEntry[] {
    return this.filteredEntries().filter((e) => e.group === group);
  }

  startEdit(entry: ConfigEntry): void {
    this.editingId.set(entry.id);
    this.editValue = entry.value;
  }

  saveEdit(entry: ConfigEntry): void {
    this.entries.update((list) =>
      list.map((e) => e.id === entry.id ? { ...e, value: this.editValue } : e)
    );
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  groupIcon(group: string): string {
    const icons: Record<string, string> = {
      payments: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z',
      delivery: 'M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 6h-2l-2 6h10l-1-6h-3l-1-3h-1l-1 3z',
      notifications: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9',
      security: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      features: 'M11 4a2 2 0 1 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a2 2 0 1 0 0 4h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0v-1a1 1 0 0 0-1-1H7a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H4a2 2 0 1 1 0-4h1a1 1 0 0 0 1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1V4z'
    };
    return icons[group.toLowerCase()] ?? 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
  }
}
