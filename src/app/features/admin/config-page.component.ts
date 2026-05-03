import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfigEntry, ConfigService } from './config.service';

@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './config-page.component.html',
  styleUrl: './config-page.component.scss'
})
export class ConfigPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly entries = signal<ConfigEntry[]>([]);
  readonly editingId = signal<string | null>(null);
  editValue = '';

  constructor(private readonly configService: ConfigService) {}

  ngOnInit(): void {
    this.configService.list().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get groups(): string[] {
    return [...new Set(this.entries().map((e) => e.group))];
  }

  entriesForGroup(group: string): ConfigEntry[] {
    return this.entries().filter((e) => e.group === group);
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
}
