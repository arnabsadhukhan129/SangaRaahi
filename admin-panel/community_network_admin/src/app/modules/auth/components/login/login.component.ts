import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, NgForm } from '@angular/forms';
import {LoaderService} from "../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../shared/services/alert.service";
import { User } from 'src/app/shared/typedefs/custom.types';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Router } from '@angular/router';
import { NotificationTokenService } from '../../services/notification-token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  login: UntypedFormGroup;
  token: string|undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationTokenService
  ) {
      this.token = undefined;
      this.login = new UntypedFormGroup({
      username: new UntypedFormControl(null, [Validators.required,Validators.email]),
      password: new UntypedFormControl(null,[Validators.required, Validators.minLength(6)]),
      recaptchaReactive: new UntypedFormControl(null,[Validators.required])
      });
    }

  ngOnInit(): void {
  }


  submit(){
    const email = this.login.controls['username'].value;
    const password = this.login.controls['password'].value;
    this.authService.login(email, password, '');
    // this.notificationService.requestPermissionForNotification().then((currentToken: string) => {
    //   // console.log("currentToken......",currentToken);
      
    //   if(currentToken) {
    //     // this.authService.login(email, password);
    //     this.authService.login(email, password, currentToken);
    //   }
    //   else{
    //     console.log("Token could not be fetched");
    //     this.authService.login(email, password, '');
    //   }
    // }).catch(error => {
    //   console.log("An error occurred when error occurred: ", error);
    //   this.authService.login(email, password, '');
    // })
  }

}
