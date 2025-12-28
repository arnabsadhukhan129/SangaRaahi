import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementRoutingModule } from './announcement-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { MaterialFileInputModule } from 'ngx-custom-material-file-input';
import { AnnouncementListComponent } from './components/announcement-list/announcement-list.component';
import { AnnouncementViewComponent } from './components/announcement-view/announcement-view.component';
import { AnnouncementCreateComponent } from './components/announcement-create/announcement-create.component';



@NgModule({
  declarations: [
    AnnouncementListComponent,
    AnnouncementViewComponent,
    AnnouncementCreateComponent
  ],
  imports: [
    CommonModule,
    AnnouncementRoutingModule,
    SharedModule,
    MaterialFileInputModule
  ]
})
export class AnnouncementModule { }
