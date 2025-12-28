import { NgModule } from '@angular/core';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { GraphQLModule, MaterialModule } from './modules';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import {CommonModule} from '@angular/common';
import { ApolloClientService } from './services/apollo-client.service';
import { LoaderComponent } from './components/loader/loader.component';
import {AlertService} from "./services/alert.service";
import { AuthService } from './services/auth/auth.service';
import { StorageService } from './services/storage.service';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ActiveInactiveDialogComponent } from './components/active-inactive-dialog/active-inactive-dialog.component';
import {DialogService} from "./services/dialog.service";
import { MaterialFileInputModule } from 'ngx-custom-material-file-input';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './components/terms-conditions/terms-conditions.component';
import { CommunityModalComponent } from './components/community-modal/community-modal.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { PdfViewModalComponent } from './components/pdf-view-modal/pdf-view-modal.component';
import { AddInputDialogeComponent } from './components/add-input-dialoge/add-input-dialoge.component';
import { AddEmailDialogeComponent } from './components/add-email-dialoge/add-email-dialoge.component';
import { EditSMSEMailComponent } from './components/edit-sms-email/edit-sms-email.component';
import { AdminSmsComponent } from './components/admin-sms/admin-sms.component';
import { AdminEmailComponent } from './components/admin-email/admin-email.component';
import { NotificationDialogComponent } from './components/notification-dialog/notification-dialog.component';
import { NotificationDetailsComponent } from './components/notification-details/notification-details.component';
import { TruncatePipe } from './custom-pipe/truncate.pipe';


@NgModule({
  declarations: [
    NotFoundComponent,
    LoaderComponent,
    PaginationComponent,
    ActiveInactiveDialogComponent,
    ComingSoonComponent,
    PrivacyPolicyComponent,
    TermsConditionsComponent,
    CommunityModalComponent,
    DialogComponent,
    PdfViewModalComponent,
    AddInputDialogeComponent,
    AddEmailDialogeComponent,
    EditSMSEMailComponent,
    AdminSmsComponent,
    AdminEmailComponent,
    NotificationDialogComponent,
    NotificationDetailsComponent,
    TruncatePipe
  ],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    GraphQLModule,
    CommonModule,
    MaterialFileInputModule,
    PdfViewerModule
  ],
  exports: [MaterialModule,ReactiveFormsModule,FormsModule,GraphQLModule, LoaderComponent,PaginationComponent, ActiveInactiveDialogComponent,MaterialFileInputModule, TruncatePipe],
  providers: [ApolloClientService, AlertService, AuthService, StorageService, DialogService]
})
export class SharedModule {
  static forRoot() {
    return {
      ngModule: SharedModule,
      providers: []
    }
  }
}
