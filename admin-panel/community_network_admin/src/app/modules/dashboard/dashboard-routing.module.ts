import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from 'src/app/shared/services/auth/auth-guard.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardDataViewsComponent } from '../dashboard/modules/dashboard-content/dashboard-data-views/dashboard-data-views.component'

const routes: Routes = [
  // {path:'community', loadChildren: () => import('./modules/community/community.module').then(module => module.CommunityModule)}
  {
    path:'',
    component:DashboardComponent,
    children: [
      {
        path:'',
        loadChildren: () => import('./modules/dashboard-content/dashboard-content.module').then(module => module.DashboardContentModule)
      },
      {
        path:'community',
        loadChildren: () => import('./modules/community/community.module').then(module => module.CommunityModule)
      },
      {
        path:'event',
        loadChildren: () => import('./modules/event/event.module').then(module => module.EventModule)
      },
      {
        path:'user',
        loadChildren: () => import('./modules/user/user.module').then(module => module.UserModule)
      },
      {
        path:'message',
        loadChildren: () => import('./modules/message/message.module').then(module => module.MessageModule)
      },
      {
        path:'member',
        loadChildren: () => import('./modules/member/member.module').then(module => module.MemberModule)
      },
      {
        path:'group',
        loadChildren: () => import('./modules/group/group.module').then(module => module.GroupModule)
      },
      {
        path:'profile',
        loadChildren: () => import('./modules/profile-module/profile-module.module').then(module => module.ProfileModuleModule)
      },
      {
        path:'announcement',
        loadChildren: () => import('./modules/announcement/announcement.module').then(module => module.AnnouncementModule)
      },
      {
        path:'sms-emails-credits-remaining',
        loadChildren: ()=> import('./modules/sms-emails-credit/sms-emails-credit.module').then(module=> module.SmsEmailsCreditModule)
      },
      {
        path:'notification',
        loadChildren: () => import('./modules/notification/notification.module').then(module => module.NotificationModule)
      },
      {
        path:'geofecingSetting',
        loadChildren: () => import('./modules/geofecing-setting/geofecing-setting-routing.module').then(module => module.GeofecingSettingRoutingModule)
      }
    ],
    canActivate: [AuthGuardService]

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
