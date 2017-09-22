// Import angular packages
import {
  inject,
  TestBed,
} from '@angular/core/testing';

// Import our files
import { CommonUtilsService } from './common-utils.service';

describe('CommonUtilsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommonUtilsService],
    });
  });

  it('should ...', inject([CommonUtilsService], (service: CommonUtilsService) => {
    expect(service).toBeTruthy();
  }));
});
