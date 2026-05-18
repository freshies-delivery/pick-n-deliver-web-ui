import { Injectable, signal } from '@angular/core';

export interface NavActiveClient {
  clientId: number;
  name:     string;
}

export interface NavActiveUser {
  userId: number;
  name:   string;
}

@Injectable({ providedIn: 'root' })
export class NavigationStateService {
  readonly activeClient = signal<NavActiveClient | null>(null);
  readonly activeUser   = signal<NavActiveUser | null>(null);

  setActiveClient(client: NavActiveClient | null): void {
    this.activeClient.set(client);
    if (client) this.activeUser.set(null);
  }

  setActiveUser(user: NavActiveUser | null): void {
    this.activeUser.set(user);
    if (user) this.activeClient.set(null);
  }

  clearAll(): void {
    this.activeClient.set(null);
    this.activeUser.set(null);
  }
}
