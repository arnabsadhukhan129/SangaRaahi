import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { GeneralResponse } from "../../../../shared/interfaces/general-response.ineterface";
@Component({
  selector: 'app-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss']
})
export class PasswordChangeComponent implements OnInit {
  passChange: UntypedFormGroup;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private authService: AuthService
  ) {
    this.passChange = new UntypedFormGroup({
      newPassword: new UntypedFormControl(null, [Validators.required,Validators.minLength(6)]),
      confirmPassword: new UntypedFormControl(null, [Validators.required,Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
  }

  submit(){
    let newPassword = this.passChange.controls['newPassword'].value;
    let confirmPassword = this.passChange.controls['confirmPassword'].value;
    const data = {
      "data": {
        "newPassword": newPassword,
        "confirmPassword": confirmPassword,
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule("adminPasswordChange").mutateData(data)
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
        // Redirect to the user list.
        this.router.navigateByUrl('auth');
      }
    });
  }
}
