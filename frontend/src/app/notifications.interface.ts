export enum NotificationTypeEnum {
  'ChatMessage'= 'ChatMessage',
  'NotificationsAvailable'= 'NotificationsAvailable',
  'Ping'= 'Ping',
}

export type NotificationType = keyof typeof NotificationTypeEnum;

export interface AppNotification {
  UnitId: string;
  Message: string;
  type: NotificationType;
}

export enum NotificationEvents {
  ReadyState = 'sse-events-ready-state',
  CurrentWindowStorage = 'current-window-storage',
}

export type EventSourceReadyState =
  | EventSource['OPEN']
  | EventSource['CLOSED']
  | EventSource['CONNECTING'];
