import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardContentRoutigModule } from './dashboard-content-routing.module'
import { DashboardDataViewsComponent } from './dashboard-data-views/dashboard-data-views.component';



@NgModule({
  declarations: [
    DashboardDataViewsComponent
  ],
  imports: [
    CommonModule,
    DashboardContentRoutigModule,
    SharedModule
  ]
})
export class DashboardContentModule { }
