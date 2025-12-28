import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { EventRoutingModule } from './event-routing.module';
import { EventComponent } from './components/event/event.component';
import { EventViewComponent } from './components/event-view/event-view.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule } from '@angular-material-components/moment-adapter';


@NgModule({
  declarations: [
    EventComponent,
    EventViewComponent,
    CreateEventComponent
  ],
  imports: [
    CommonModule,
    EventRoutingModule,
    SharedModule,
    NgxMatDatetimePickerModule,
    NgxMatMomentModule
  ]
})
export class EventModule { }
