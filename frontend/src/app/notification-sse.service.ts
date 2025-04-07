import {Injectable} from '@angular/core';
import {
  AppNotification,
  EventSourceReadyState,
  NotificationType,
  NotificationTypeEnum,
  NotificationEvents
} from './notifications.interface';
import {BehaviorSubject, filter, fromEvent, map, merge, Observable, startWith} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationSseService {

  notification$: BehaviorSubject<AppNotification | null> = new BehaviorSubject<AppNotification | null>(null);

  private eventSource!: EventSource;

  public get isCurrentWindowWithSseConnection(): boolean {
    const readyState = this.eventSource?.readyState ?? EventSource.CLOSED;
    return readyState !== EventSource.CLOSED;
  }

  private get eventSourceReadyState(): number {
    const readyState = localStorage.getItem(NotificationEvents.ReadyState) as string;
    return JSON.parse(readyState) ?? EventSource.CLOSED;
  }

  private get hasSseConnection(): boolean {
    return (
      this.eventSourceReadyState === EventSource.OPEN ||
      this.eventSourceReadyState === EventSource.CONNECTING
    );
  }


  constructor() {
    this.getNotification().subscribe((notification) => this.notification$.next(notification));
  }

  createSseConnection(): void {
    if (this.hasSseConnection) {
      return;
    }
    if (this.eventSource) {
      this.eventSource.close(); // Close the previous connection if it exists in case of reload page
    }
    this.eventSource = new EventSource('http://localhost:3000/sse') as EventSource;
    this.setEventSourceReadyState(EventSource.CONNECTING);
    this.eventSource.onopen = () => this.setEventSourceReadyState(EventSource.OPEN);
    this.eventSource.onerror = async () => {
      this.setEventSourceReadyState(EventSource.CLOSED);
    };
    this.eventSource.addEventListener(NotificationTypeEnum.NotificationsAvailable, ({ data }) => {
      const notification = this.generateNotification(data, NotificationTypeEnum.NotificationsAvailable);
      this.setSseEventData(notification);
    });
    this.eventSource.addEventListener(NotificationTypeEnum.ChatMessage, ({ data }) => {
      const notification = this.generateNotification(data, NotificationTypeEnum.ChatMessage);
      this.setSseEventData(notification);
    });
    this.eventSource.addEventListener(NotificationTypeEnum.Ping, () => console.log('ping'));
  }

  private setSseEventData(payload: AppNotification): void {
    localStorage.setItem(payload.type, JSON.stringify(payload));
    const event = new StorageEvent(NotificationEvents.CurrentWindowStorage, {
      key: payload.type,
      newValue: JSON.stringify(payload),
    });
    window.dispatchEvent(event);
  }

  private generateNotification(stream: string, type: NotificationType): AppNotification {
    return {
      ...this.parseNotification(stream),
      type,
    }
    }

  private parseNotification(stream: string): AppNotification {
    let isString = true;
    let data = stream;
    while (isString) {
      data = JSON.parse(data);
      isString = typeof data === 'string';
    }
    return data as unknown as AppNotification;
  }


  setEventSourceReadyState(readyState: EventSourceReadyState): void {
    localStorage.setItem(NotificationEvents.ReadyState, `${readyState}`);
  }

  private getNotification(): Observable<AppNotification> {
    const currentWindowStorage$ = fromEvent<StorageEvent>(window, NotificationEvents.CurrentWindowStorage);
    const storage$ = fromEvent<StorageEvent>(window, 'storage');
    const notificationData = localStorage.getItem(NotificationTypeEnum.NotificationsAvailable);
    return merge(storage$, currentWindowStorage$).pipe(
      startWith({key: NotificationTypeEnum.NotificationsAvailable, newValue: notificationData} as StorageEvent),
      filter(({key}: StorageEvent) => key === NotificationTypeEnum.ChatMessage || key === NotificationTypeEnum.NotificationsAvailable),
      map(({ newValue }: StorageEvent) => JSON.parse(newValue || '')),
    );
  }
}
