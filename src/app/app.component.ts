import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocationService } from './core/services/location.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.locationService.loadLocations().subscribe();
  }
}
