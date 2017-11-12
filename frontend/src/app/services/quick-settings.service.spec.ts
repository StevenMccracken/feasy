// Import angular packages
import {
  inject,
  TestBed,
} from '@angular/core/testing';

// Import our files
import { QuickSettingsService } from './quick-settings.service';

describe('QuickSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuickSettingsService],
    });
  });

  it('should ...', inject([QuickSettingsService], (service: QuickSettingsService) => {
    expect(service).toBeTruthy();
  }));
});
