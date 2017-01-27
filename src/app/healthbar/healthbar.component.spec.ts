/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HealthbarComponent } from './healthbar.component';

describe('HealthbarComponent', () => {
  let component: HealthbarComponent;
  let fixture: ComponentFixture<HealthbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
