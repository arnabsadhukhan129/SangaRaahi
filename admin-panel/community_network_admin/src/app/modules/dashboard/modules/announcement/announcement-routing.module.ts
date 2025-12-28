import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnnouncementListComponent } from './components/announcement-list/announcement-list.component';
import { AnnouncementViewComponent } from './components/announcement-view/announcement-view.component';
import { AnnouncementCreateComponent } from './components/announcement-create/announcement-create.component';

const routes: Routes = [
  {
    path:'',
    component:AnnouncementListComponent
  },
  {
    path:'create',
    component:AnnouncementCreateComponent
  },
  {
    path:'edit/:id',
    component:AnnouncementCreateComponent
  },
  {
    path:'view/:id',
    component:AnnouncementViewComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnnouncementRoutingModule { }
