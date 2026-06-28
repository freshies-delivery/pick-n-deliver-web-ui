import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderSocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private client: Client | null = null;
  private isConnected = false;
  private pendingCallbacks: Array<() => void> = [];

  constructor(private readonly zone: NgZone) {}

  private get brokerURL(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/websocket`;
  }

  private ensureClient(): void {
    if (this.client) return;
    const token = this.auth.token;
    this.client = new Client({
      brokerURL: this.brokerURL,
      reconnectDelay: 5000,
      // Forwarded on the STOMP CONNECT frame for broker-side authentication.
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        this.isConnected = true;
        const pending = [...this.pendingCallbacks];
        this.pendingCallbacks = [];
        pending.forEach(cb => cb());
      },
      onDisconnect: () => {
        this.isConnected = false;
      },
    });
    this.client.activate();
  }

  /** Subscribes to an arbitrary STOMP destination; emits each parsed message body. */
  watch(destination: string): Observable<any> {
    this.ensureClient();

    return new Observable(observer => {
      let stompSub: StompSubscription | undefined;
      let teardownCalled = false;

      const doSubscribe = () => {
        if (teardownCalled || !this.client) return;
        stompSub = this.client.subscribe(destination, (msg: IMessage) => {
          try {
            const data = JSON.parse(msg.body);
            this.zone.run(() => observer.next(data));
          } catch { /* ignore */ }
        });
      };

      if (this.isConnected) {
        doSubscribe();
      } else {
        this.pendingCallbacks.push(doSubscribe);
      }

      return () => {
        teardownCalled = true;
        stompSub?.unsubscribe();
      };
    });
  }

  watchOrder(orderId: number): Observable<any> {
    return this.watch(`/topic/orders/${orderId}`);
  }

  /** New orders placed for an outlet (full order payload). */
  watchOutletOrders(outletId: number): Observable<any> {
    return this.watch(`/topic/outlet/${outletId}/orders`);
  }

  /** Status changes for an outlet's orders ({ orderId, status }). */
  watchOutletOrderUpdates(outletId: number): Observable<{ orderId: number; status: string }> {
    return this.watch(`/topic/outlet/${outletId}/order-updates`);
  }

  ngOnDestroy(): void {
    this.client?.deactivate();
    this.client = null;
  }
}
