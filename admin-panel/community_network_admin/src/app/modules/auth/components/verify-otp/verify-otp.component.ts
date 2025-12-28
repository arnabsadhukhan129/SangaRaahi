import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { GeneralResponse } from "../../../../shared/interfaces/general-response.ineterface";

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
  confirmOtp: UntypedFormGroup;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private authService: AuthService
  ) {
    this.confirmOtp = new UntypedFormGroup({
      otp: new UntypedFormControl(null, [Validators.required,Validators.min(100000),Validators.max(999999)])
    });
  }

  ngOnInit(): void {
  }

  submitOtp(){
    let otp = this.confirmOtp.controls['otp'].value;
    this.authService.verifyOtp(otp);
  }

  submit(){
    let otp = this.confirmOtp.controls['otp'].value;
    const data = {
      "data": {
        "otp": otp,
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule("verifyAdminPasswordOtp").mutateData(data)
    .subscribe((response:GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        if(response.code === 400) {
          // Sow toaster
          this.alertService.error(response.message);
        }else{
          this.alertService.error("Timed out.");
          this.router.navigateByUrl('auth/forget-password');
        }
      } else {
        // Redirect to the password change page.
        this.router.navigateByUrl('auth/change-password');
      }
    });
  }

  resendOtp() {
    this.loaderService.show();
    this.apolloClient.setModule("adminPasswordResendOtp").mutateData('')
    .subscribe((response:GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        if(response.code === 401) {
          this.alertService.error("Timed out.");
          this.router.navigateByUrl('auth/forget-password');
        }else{
          this.alertService.error(response.message);
        }
      } else {
        this.alertService.success(response.message);
      }
    });
  }

  numericOnly(event: { which: any; keyCode: any; }): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 101 || charCode == 69 || charCode == 45 || charCode == 43) {
      return false;
    }
    return true;

  }

}
