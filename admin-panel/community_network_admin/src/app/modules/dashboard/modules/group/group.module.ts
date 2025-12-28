import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './components/group-list/group.component';
import { GroupCreateComponent } from './components/group-create/group-create.component';
import { GroupEditComponent } from './components/group-edit/group-edit.component';
import { GroupViewComponent } from './components/group-view/group-view.component';
import { GroupMemberAddComponent } from './components/group-member-add/group-member-add.component';
import { GroupMemberComponent } from './components/group-member/group-member.component';


@NgModule({
  declarations: [
    GroupComponent,
    GroupCreateComponent,
    GroupEditComponent,
    GroupViewComponent,
    GroupMemberAddComponent,
    GroupMemberComponent
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    SharedModule
  ]
})
export class GroupModule { }
