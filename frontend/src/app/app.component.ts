import {AfterViewInit, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NotificationSseService} from './notification-sse.service';
import {filter, fromEvent, merge, tap} from 'rxjs';
import {AppNotification, NotificationEvents} from './notifications.interface';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  notification!: AppNotification;

  @HostListener('window:beforeunload')
  closeSseConnection(): void {
    if (this.notificationSseService.isCurrentWindowWithSseConnection) {
      this.notificationSseService.setEventSourceReadyState(EventSource.CLOSED);
    }
  }

  constructor(private notificationSseService: NotificationSseService) {
  }

  ngOnInit(): void {
    this.notificationSseService.createSseConnection();
    const visibilityChange$ = fromEvent(window, 'visibilitychange').pipe(
      filter(() => !document.hidden));
    const readyStateChange$ = fromEvent<StorageEvent>(window, 'storage').pipe(
      filter(({ key }: StorageEvent) => key === NotificationEvents.ReadyState)
    );
    merge(visibilityChange$, readyStateChange$)
      .subscribe(() => this.notificationSseService.createSseConnection());

    this.notificationSseService.notification$.subscribe((notification) => {
      if (notification) {
        this.notification = notification;
      }
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.closeSseConnection();
  }
}
