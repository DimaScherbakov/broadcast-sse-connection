import { TestBed } from '@angular/core/testing';

import { NotificationSseService } from './notification-sse.service';

describe('NotificationSseService', () => {
  let service: NotificationSseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationSseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
