import { TestBed, inject } from '@angular/core/testing';

import { FeasyService } from './feasy.service';

describe('FeasyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeasyService]
    });
  });

  it('should ...', inject([FeasyService], (service: FeasyService) => {
    expect(service).toBeTruthy();
  }));
});
