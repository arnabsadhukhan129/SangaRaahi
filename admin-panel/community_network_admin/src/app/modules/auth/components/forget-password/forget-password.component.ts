import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import {GeneralResponse} from "../../../../shared/interfaces/general-response.ineterface";

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  forgotPassword: UntypedFormGroup;

  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private authService:AuthService
  ) {
    this.forgotPassword = new UntypedFormGroup({
     email: new UntypedFormControl(null, [Validators.required,Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")])
    });
  }

  ngOnInit(): void {
  }

  submit(){
    let email = this.forgotPassword.controls['email'].value;
    const data = {
      "data": {
        "email": email
      }
    }
    this.loaderService.show();
        this.apolloClient.setModule("adminForgotPassword").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          this.loaderService.hide();
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success("OTP sent successfully.");
            this.authService.setOtpToken(response.data.token);
            // Redirect to the user list.
            this.router.navigateByUrl('auth/verify-password');
          }
        });
  }

}
