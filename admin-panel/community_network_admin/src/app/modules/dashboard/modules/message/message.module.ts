import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { MessageRoutingModule } from './message-routing.module';
import { MessageComponent } from './components/message/message.component';


@NgModule({
  declarations: [
    MessageComponent
  ],
  imports: [
    CommonModule,
    MessageRoutingModule,
    SharedModule
  ]
})
export class MessageModule { }
