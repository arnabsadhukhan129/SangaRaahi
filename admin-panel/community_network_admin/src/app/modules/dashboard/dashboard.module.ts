import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuListItemComponent } from './components/menu-list-item/menu-list-item.component';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  declarations: [
    DashboardComponent,
    MenuListItemComponent,
    NotificationComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule
  ],

})
export class DashboardModule { }
