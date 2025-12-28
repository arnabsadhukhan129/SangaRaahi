import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserComponent } from './components/user-list/user.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { UserViewComponent } from './components/user-view/user-view.component';

const routes: Routes = [
  {
    path:'',
    component : UserComponent
  },
  {
    path:'create',
    component : UserCreateComponent
  },
  {
    path:'edit/:id',
    component : UserCreateComponent
  },
  {
    path:'view/:id',
    component : UserViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
