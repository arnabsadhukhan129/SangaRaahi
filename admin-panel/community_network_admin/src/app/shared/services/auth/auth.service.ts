import { Injectable } from '@angular/core';
import { User } from '../../typedefs/custom.types';
import { StorageService } from '../storage.service';
import {LoaderService} from "../loader.service";
import {ApolloClientService} from "../apollo-client.service";
import {AlertService} from "../alert.service";
import {Router} from "@angular/router";
import {GeneralResponse} from "../../interfaces/general-response.ineterface";

@Injectable()
export class AuthService {

  constructor(private storage: StorageService,
              private loader: LoaderService,
              private apollo: ApolloClientService,
              private alertService: AlertService,
              private router: Router,) { }

  isLogin() {
    return this.storage.hasLocalItem('authToken') && this.storage.hasLocalItem('userData');
  }

  login(email:string, password:string, token: string='') {
    const data = {
      data:{
        email:email,
        password:password,
        webToken: token,
        deviceType: 'web'
      }
    };
    this.loader.show();
    this.apollo.setModule("adminLogin").mutateData(data)
      .subscribe((response:GeneralResponse) => {
        this.loader.hide();
        if(response.error) {
          // Sow toaster
          this.alertService.error(response.message);
        } else {
          // this.alertService.success("Logged-in successfully.");
          this.alertService.success("Send otp in your email");
          this.router.navigateByUrl('/auth/verify-otp');
          this.storage.setLocalStorageItem("loginAccessToken", response.data.token.accessToken);
          // const user: User = response.data.user;
          // const token = response.data.token.accessToken;
          // const refreshToken = response.data.token.refreshToken;
          // this.setToken(token);
          // this.setRefreshToken(refreshToken);
          // this.setUserDetails(user);
          // // Redirect to the dashboard for now. Will use the last visited url
          // this.router.navigateByUrl('/dashboard');
        }

      })
  }

  verifyOtp(otp:number){
    const data = {
      data:{
        otp: otp
      }
    }
    this.loader.show();
    this.apollo.setModule("verifyAdminPasswordOtp").mutateData(data)
      .subscribe((response:GeneralResponse) => {
        this.loader.hide();
        if(response.error) {
          // Sow toaster
          this.alertService.error(response.message);
        } else {
          this.alertService.success("Logged-in successfully.");
          const user: User = response.data.user;
          const token = response.data.token.accessToken;
          const refreshToken = response.data.token.refreshToken;
          this.setToken(token);
          this.setRefreshToken(refreshToken);
          this.setUserDetails(user);
          // // Redirect to the dashboard for now. Will use the last visited url
          this.router.navigateByUrl('/dashboard');
        }
      })
  }

  logout() {
    console.log("Logging out");
    this.loader.show();
    this.apollo.setModule("logout").mutateData('').subscribe((response:GeneralResponse) => {
      console.log("Logout response");
      if(response.error) {
        // Sow toaster
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        // Redirect to the auth.
        this.storage.removeLocalItem('authToken');
        this.storage.removeLocalItem('userData');
        this.storage.removeLocalItem('refreshToken');
        this.storage.removeLocalItem('loginAccessToken');
        this.storage.removeLocalItem('sr_OtpToken');
        this.router.navigateByUrl('/auth');
      }
      this.loader.hide();
    });
  }

  getToken() {
    this.storage.getLocalStorageItem("authToken", "");
  }

  private setToken(token:string) {
    this.storage.setLocalStorageItem("authToken", token);
  }

  private setUserDetails(user:User){
    this.storage.setLocalStorageItem("userData", JSON.stringify(user));
  }

  private setRefreshToken(token:string) {
    this.storage.setLocalStorageItem('refreshToken', token);
  }

  public setOtpToken(token:string) {
    this.storage.setLocalStorageItem("sr_OtpToken", token);
  }

  getOtpToken() {
    this.storage.getLocalStorageItem("sr_OtpToken", "");
  }

}
