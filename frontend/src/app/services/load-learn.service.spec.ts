import { TestBed, inject } from '@angular/core/testing';

import { LoadLearnService } from './load-learn.service';

describe('LoadLearnService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadLearnService]
    });
  });

  it('should ...', inject([LoadLearnService], (service: LoadLearnService) => {
    expect(service).toBeTruthy();
  }));
});
