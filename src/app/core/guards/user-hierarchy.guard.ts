import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserHierarchyGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const userId = route.paramMap.get('userId');

    if (!userId) {
      this.router.navigate(['/users']);
      return false;
    }

    return true;
  }
}

