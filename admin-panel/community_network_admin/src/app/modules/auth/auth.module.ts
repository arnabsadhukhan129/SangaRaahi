import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { LoginComponent } from './components/login/login.component';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
import {SharedModule} from "../../shared/shared.module";
import { RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from '../../../environments/environment';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { VerifyOtpForgetPasswordComponent } from './components/verify-otp-forget-password/verify-otp-forget-password.component';
@NgModule({
  declarations: [
    LoginComponent,
    ForgetPasswordComponent,
    VerifyOtpComponent,
    PasswordChangeComponent,
    VerifyOtpForgetPasswordComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    MaterialModule,
    SharedModule,
    RecaptchaModule,
    RecaptchaFormsModule,
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.siteKey,
      } as RecaptchaSettings,
    },
  ],
})
export class AuthModule { }
