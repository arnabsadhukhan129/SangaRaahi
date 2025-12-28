import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupComponent } from './components/group-list/group.component';
import { GroupCreateComponent } from './components/group-create/group-create.component';
import { GroupEditComponent } from './components/group-edit/group-edit.component';
import { GroupViewComponent } from './components/group-view/group-view.component';
import { GroupMemberAddComponent } from './components/group-member-add/group-member-add.component';
import { GroupMemberComponent } from './components/group-member/group-member.component';

const routes: Routes = [
  {
    path:'',
    component:GroupComponent
  },
  {
    path:'create',
    component:GroupCreateComponent
  },
  {
    path:'edit/:id',
    component:GroupEditComponent
  },
  {
    path:'view/:id',
    component:GroupViewComponent
  },
  {
    path:'member-add/:id',
    component:GroupMemberAddComponent
  },
  {
    path:'member/:id',
    component:GroupMemberComponent
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupRoutingModule { }
