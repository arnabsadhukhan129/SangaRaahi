import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditsRemaninngComponent } from './credits-remaninng.component';

describe('CreditsRemaninngComponent', () => {
  let component: CreditsRemaninngComponent;
  let fixture: ComponentFixture<CreditsRemaninngComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditsRemaninngComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditsRemaninngComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
