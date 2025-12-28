import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmailDialogeComponent } from './add-email-dialoge.component';

describe('AddEmailDialogeComponent', () => {
  let component: AddEmailDialogeComponent;
  let fixture: ComponentFixture<AddEmailDialogeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEmailDialogeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEmailDialogeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
