import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommunityListComponent } from './components/community-list/community-list.component';
import { CommunityCreateComponent } from './components/community-create/community-create.component';
import { CommunityEditComponent } from './components/community-edit/community-edit.component';
import { CommunityViewComponent } from './components/community-view/community-view.component';
import { CommunityMemberComponent } from './components/community-member/community-member.component';
import { CommunitySettingComponent } from './components/community-setting/community-setting.component';
import { CommunityWebpageApprovalComponent } from './components/community-webpage-approval/community-webpage-approval.component';

const routes: Routes = [
  {
    path:'',
    component:CommunityListComponent
  },
  {
    path:'create',
    component:CommunityCreateComponent
  },
  {
    path:'edit/:id',
    component:CommunityEditComponent
  },
  {
    path:'view/:id',
    component:CommunityViewComponent
  },
  {
    path:'member/:id',
    component:CommunityMemberComponent
  },
  {
    path:'setting/:id',
    component:CommunitySettingComponent
  },
  {
    path:'webpageApproval/:id/:slug',
    component:CommunityWebpageApprovalComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommunityRoutingModule { }
