import { TestBed, inject } from '@angular/core/testing';

import { CommonUtilsService } from './common-utils.service';

describe('CommonUtilsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommonUtilsService]
    });
  });

  it('should ...', inject([CommonUtilsService], (service: CommonUtilsService) => {
    expect(service).toBeTruthy();
  }));
});
