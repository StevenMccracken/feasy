import { TestBed, inject } from '@angular/core/testing';

import { QuickAddService } from './quick-add.service';

describe('QuickAddService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuickAddService],
    });
  });

  it('should ...', inject([QuickAddService], (service: QuickAddService) => {
    expect(service).toBeTruthy();
  }));
});
