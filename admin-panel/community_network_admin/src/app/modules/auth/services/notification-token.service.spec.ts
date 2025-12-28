import { TestBed } from '@angular/core/testing';

import { NotificationTokenService } from './notification-token.service';

describe('NotificationTokenService', () => {
  let service: NotificationTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
