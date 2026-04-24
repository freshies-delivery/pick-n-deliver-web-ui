import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FabActionService } from '../../../core/services/fab-action.service';

@Component({
  selector: 'app-global-fab',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatIconModule],
  templateUrl: './global-fab.component.html',
  styleUrl: './global-fab.component.scss'
})
export class GlobalFabComponent {
  private readonly router = inject(Router);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly fabService = inject(FabActionService);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncFabFromRoute());

    this.syncFabFromRoute();
  }

  onFabClick(): void {
    this.fabService.trigger();
  }

  private syncFabFromRoute(): void {
    let route = this.activeRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot.data as { showFab?: boolean; fabAction?: string };
    this.fabService.configure(!!data.showFab, data.fabAction);
  }
}

