// Import angular packages
import {
  inject,
  TestBed,
} from '@angular/core/testing';

// Import our files
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStorageService],
    });
  });

  it('should ...', inject([LocalStorageService], (service: LocalStorageService) => {
    expect(service).toBeTruthy();
  }));
});
