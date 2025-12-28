import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationRoutingModule } from './notification-routing.module';
import { ListComponent } from './list/list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MaterialFileInputModule } from 'ngx-custom-material-file-input';


@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    NotificationRoutingModule,
    SharedModule,
    MaterialFileInputModule
  ]
})
export class NotificationModule { }
