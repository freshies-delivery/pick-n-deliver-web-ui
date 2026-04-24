import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class HierarchyGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const clientId = route.paramMap.get('clientId');
    const outletId = route.paramMap.get('outletId');
    const categoryId = route.paramMap.get('categoryId');
    const path = route.routeConfig?.path ?? '';

    const requiresClient = path.includes(':clientId');
    const requiresOutlet = path.includes(':outletId');
    const requiresCategory = path.includes(':categoryId');

    if (requiresClient && !clientId) {
      this.router.navigate(['/client']);
      return false;
    }

    if (requiresOutlet && !outletId) {
      this.router.navigate(['/client']);
      return false;
    }

    if (requiresCategory && !categoryId) {
      this.router.navigate(['/client']);
      return false;
    }

    return true;
  }
}

