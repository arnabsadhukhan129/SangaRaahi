import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyOtpForgetPasswordComponent } from './verify-otp-forget-password.component';

describe('VerifyOtpForgetPasswordComponent', () => {
  let component: VerifyOtpForgetPasswordComponent;
  let fixture: ComponentFixture<VerifyOtpForgetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerifyOtpForgetPasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyOtpForgetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
