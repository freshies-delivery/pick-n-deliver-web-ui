import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss'
})
export class BreadcrumbsComponent {
  readonly breadcrumbs$ = inject(BreadcrumbService).breadcrumbs$;
}
