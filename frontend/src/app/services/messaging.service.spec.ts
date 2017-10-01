// Import Angular packages
import {
  inject,
  TestBed,
} from '@angular/core/testing';

// Import our files
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessagingService],
    });
  });

  it('should ...', inject([MessagingService], (service: MessagingService) => {
    expect(service).toBeTruthy();
  }));
});
