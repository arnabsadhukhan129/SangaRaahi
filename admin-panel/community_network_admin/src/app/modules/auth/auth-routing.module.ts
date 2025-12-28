import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { LoginComponent } from './components/login/login.component';
import {AuthPreventService} from "../../shared/services/auth/auth-prevent.service";
import { VerifyOtpForgetPasswordComponent } from './components/verify-otp-forget-password/verify-otp-forget-password.component';

const routes: Routes = [
  {path:'', component: LoginComponent, canActivate:[AuthPreventService]},
  {path:'forget-password', component:ForgetPasswordComponent, canActivate:[AuthPreventService]},
  {path:'verify-otp', component:VerifyOtpComponent, canActivate:[AuthPreventService]},
  {path:'change-password', component:PasswordChangeComponent, canActivate:[AuthPreventService]},
  {path:'verify-password', component:VerifyOtpForgetPasswordComponent, canActivate:[AuthPreventService]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
