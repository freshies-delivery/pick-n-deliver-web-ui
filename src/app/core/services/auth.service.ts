import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
}

const STORAGE_KEY = 'swiftly_user';
const TOKEN_KEY   = 'swiftly_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.loadFromStorage());

  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null && !!this.token;
  }

  login(email: string, password: string): Observable<{ success: boolean; token: string }> {
    return this.http.post<{ success: boolean; token: string }>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        if (res.success && res.token) {
          localStorage.setItem(TOKEN_KEY, res.token);
          const namePart = email.split('@')[0];
          const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          const initials = name.slice(0, 2).toUpperCase();
          const user: AuthUser = { name, email, initials };
          this.userSubject.next(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    this.userSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
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
