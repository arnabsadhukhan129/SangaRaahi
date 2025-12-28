import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSMSEMailComponent } from './edit-sms-email.component';

describe('EditSMSEMailComponent', () => {
  let component: EditSMSEMailComponent;
  let fixture: ComponentFixture<EditSMSEMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSMSEMailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSMSEMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
