import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditsRemaninngComponent } from './credits-remaninng/credits-remaninng.component';

const routes: Routes = [
  {path:'', component:CreditsRemaninngComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SmsEmailsCreditRoutingModule { }
