import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
}

const STORAGE_KEY = 'swiftly_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.loadFromStorage());

  readonly currentUser$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  login(email: string, _password: string): void {
    const namePart = email.split('@')[0];
    const name = namePart
      .charAt(0).toUpperCase() + namePart.slice(1)
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .split(' ')[0];
    const initials = name.slice(0, 2).toUpperCase();
    const user: AuthUser = { name, email, initials };
    this.userSubject.next(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  logout(): void {
    this.userSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
