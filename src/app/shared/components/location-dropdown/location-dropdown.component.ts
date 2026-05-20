import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LocationService } from '../../../core/services/location.service';
import { Location } from '../../../core/models/location.model';

@Component({
  selector: 'app-location-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-dropdown.component.html',
  styleUrl: './location-dropdown.component.scss'
})
export class LocationDropdownComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly pendingSelected = signal<Location[]>([]);

  readonly filteredLocations = computed(() =>
    this.locationService.locations().filter(
      (l) =>
        l.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        l.description.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  readonly selectedCount = computed(() => this.locationService.selected().length);

  ngAfterViewInit(): void {
    if (this.isOpen() && this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.pendingSelected.set([...this.locationService.selected()]);
      setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
    }
  }

  togglePending(loc: Location): void {
    const curr = this.pendingSelected();
    const idx = curr.findIndex((l) => l.id === loc.id);
    if (idx >= 0) {
      this.pendingSelected.set(curr.filter((_, i) => i !== idx));
    } else {
      this.pendingSelected.set([...curr, loc]);
    }
  }

  isPending(loc: Location): boolean {
    return this.pendingSelected().some((l) => l.id === loc.id);
  }

  clearPending(): void {
    this.pendingSelected.set([]);
  }

  apply(): void {
    this.locationService.setSelected(this.pendingSelected());
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate(['/dashboard']);
  }

  trackById(_: number, loc: Location): number {
    return loc.id;
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}
