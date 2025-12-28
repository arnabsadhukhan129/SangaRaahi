import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommunityRoutingModule } from './community-routing.module';
import { CommunityListComponent } from './components/community-list/community-list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommunityCreateComponent } from './components/community-create/community-create.component';
import { CommunityEditComponent } from './components/community-edit/community-edit.component';
import { CommunityViewComponent } from './components/community-view/community-view.component';
import { MaterialFileInputModule } from 'ngx-custom-material-file-input';
import { CommunityMemberComponent } from './components/community-member/community-member.component';
import { CommunitySettingComponent } from './components/community-setting/community-setting.component';
import { CommunityWebpageApprovalComponent } from './components/community-webpage-approval/community-webpage-approval.component';
import { CommunityApprovalHomeComponent } from './components/community-webpage-approval/tabs/home/home.component';
import { CommunityApprovalVideoComponent } from './components/community-webpage-approval/tabs/video/video.component';
import { CommunityApprovalPaymentDetailComponent } from './components/community-webpage-approval/tabs/payment-detail/payment-detail.component';
import { CommunityApprovalAboutUsComponent } from './components/community-webpage-approval/tabs/about-us/about-us.component';
import { CommunityHomeSettingComponent } from './components/community-setting/community-home-setting/community-home-setting.component';
import { CommunityVideoSettingComponent } from './components/community-setting/community-video-setting/community-video-setting.component';
import { CommunityPaymentSettingComponent } from './components/community-setting/community-payment-setting/community-payment-setting.component';
import { CommunityAboutUsSettingComponent } from './components/community-setting/community-aboutus-setting/community-aboutus-setting.component';
import { VideoComponent } from './components/community-setting/view-modal/video/video.component';
import { PaymentDetailComponent } from './components/community-setting/view-modal/payment-detail/payment-detail.component';
import { HomeSettingViewComponent } from './components/community-setting/view-modal/home/home.component';
import { AboutUsSettingViewComponent } from './components/community-setting/view-modal/about-us/about-us.component';

@NgModule({
  declarations: [
    CommunityListComponent,
    CommunityCreateComponent,
    CommunityEditComponent,
    CommunityViewComponent,
    CommunityMemberComponent,
    CommunitySettingComponent,
    CommunityWebpageApprovalComponent,
    CommunityApprovalHomeComponent,
    CommunityApprovalVideoComponent,
    CommunityApprovalPaymentDetailComponent,
    CommunityApprovalAboutUsComponent,
    CommunityHomeSettingComponent,
    CommunityVideoSettingComponent,
    CommunityPaymentSettingComponent,
    CommunityAboutUsSettingComponent,
    VideoComponent,
    PaymentDetailComponent,
    HomeSettingViewComponent,
    AboutUsSettingViewComponent
  ],
  imports: [
    CommonModule,
    CommunityRoutingModule,
    SharedModule,
    MaterialFileInputModule
  ]
})
export class CommunityModule { }
