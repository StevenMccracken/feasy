import { TestBed, inject } from '@angular/core/testing';

import { AssignmentService } from './assignment.service';

describe('AssignmentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssignmentService]
    });
  });

  it('should ...', inject([AssignmentService], (service: AssignmentService) => {
    expect(service).toBeTruthy();
  }));
});
