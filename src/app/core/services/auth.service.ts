import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<{ name: string; email: string } | null>(null);

  currentUser$ = this.userSubject.asObservable();
  isLoggedIn$ = new BehaviorSubject<boolean>(false);

  login(email: string, password: string): void {
    const namePart = email.split('@')[0];
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).split(' ')[0];
    const user = { name, email };
    this.userSubject.next(user);
    this.isLoggedIn$.next(true);
  }

  logout(): void {
    this.userSubject.next(null);
    this.isLoggedIn$.next(false);
  }
}
