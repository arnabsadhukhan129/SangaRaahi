import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { GeofecingSettingRoutingModule } from './geofecing-setting-routing.module';
import { SettingComponent } from './setting/setting.component';


@NgModule({
  declarations: [
    SettingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GeofecingSettingRoutingModule,
    SharedModule
  ]
})
export class GeofecingSettingModule { }
