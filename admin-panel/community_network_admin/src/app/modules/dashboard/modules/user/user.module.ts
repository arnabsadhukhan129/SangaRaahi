import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './components/user-list/user.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { UserViewComponent } from './components/user-view/user-view.component';


@NgModule({
  declarations: [
    UserComponent,
    UserCreateComponent,
    UserViewComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule
  ]
})
export class UserModule { }
