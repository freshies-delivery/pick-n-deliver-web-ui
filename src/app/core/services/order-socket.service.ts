import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class OrderSocketService implements OnDestroy {
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
    this.client = new Client({
      brokerURL: this.brokerURL,
      reconnectDelay: 5000,
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

  watchOrder(orderId: number): Observable<any> {
    this.ensureClient();
    const topic = `/topic/orders/${orderId}`;

    return new Observable(observer => {
      let stompSub: StompSubscription | undefined;
      let teardownCalled = false;

      const doSubscribe = () => {
        if (teardownCalled || !this.client) return;
        stompSub = this.client.subscribe(topic, (msg: IMessage) => {
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

  ngOnDestroy(): void {
    this.client?.deactivate();
    this.client = null;
  }
}
