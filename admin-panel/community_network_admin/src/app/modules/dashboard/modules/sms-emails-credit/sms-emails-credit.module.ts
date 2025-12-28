import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { SmsEmailsCreditRoutingModule } from './sms-emails-credit-routing.module';
import { CreditsRemaninngComponent } from './credits-remaninng/credits-remaninng.component';


@NgModule({
  declarations: [
    CreditsRemaninngComponent
  ],
  imports: [
    CommonModule,
    SmsEmailsCreditRoutingModule,
    SharedModule
  ]
})
export class SmsEmailsCreditModule { }
