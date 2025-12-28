import { Injectable } from '@angular/core';
import {DialogDataModel, AlertDialogDataModel, DisplayPdfModel, DialogAddSMS, AlertDialogNotificationDataModel} from "../models/dialog-data.model";
import {MatLegacyDialog as MatDialog} from "@angular/material/legacy-dialog";
import {ActiveInactiveDialogComponent} from "../components/active-inactive-dialog/active-inactive-dialog.component";
import {Observable} from "rxjs";
import {DialogAction, AlertDialogAction, DisplayPdfAction, DialogActionAdd} from "../enums/common.enums";
import {DialogComponent} from "../components/dialog/dialog.component";
import { PdfViewModalComponent } from "../components/pdf-view-modal/pdf-view-modal.component";
import { AddInputDialogeComponent } from '../components/add-input-dialoge/add-input-dialoge.component';
import { AddEmailDialogeComponent } from '../components/add-email-dialoge/add-email-dialoge.component';
import { EditSMSEMailComponent } from '../components/edit-sms-email/edit-sms-email.component';
import { AdminSmsComponent } from '../components/admin-sms/admin-sms.component';
import { AdminEmailComponent } from '../components/admin-email/admin-email.component';
import { NotificationDialogComponent } from '../components/notification-dialog/notification-dialog.component';
import { NotificationDetailsComponent } from '../components/notification-details/notification-details.component';


@Injectable()
export class DialogService {

  constructor(public dialog: MatDialog) { }

  public openDialog(type:DialogAction, data:DialogDataModel) {
    switch (type) {
      case DialogAction.DELETE:
        return this.openDeleteDialog(data);
      case DialogAction.STATUS:
        return this.openStatusChangeDialog(data);
    }
  }

  public openAddInputDialog(type:DialogActionAdd, data:DialogAddSMS){
    switch (type) {
      case DialogActionAdd.AddSMS:
        return this.openAddNumberDialog(data);
      case DialogActionAdd.AddEmail:
        return this.openAddEmailDialog(data); 
      case DialogActionAdd.Edit:
        return this.openEditSMSEmailDialog(data); 
      case DialogActionAdd.AddAdminSms:
        return this.openAddSmsAdmin(data);
      case DialogActionAdd.AddAdminEmail:
        return this.openAddEmailAdmin(data);
    }
  }

  public openAlertDialog(type:AlertDialogAction, data:AlertDialogDataModel) {
    switch (type) {
      case AlertDialogAction.ALERT:
        return this.openAlertDialogContent(data);
    }
  }

  public openNotificationDialog(type:AlertDialogAction, data:AlertDialogDataModel) {
    switch (type) {
      case AlertDialogAction.ALERT:
        return this.openAlertNotification(data);
    }
  }

  public openNotificationDetailsDialog(type:AlertDialogAction, data:AlertDialogNotificationDataModel) {
    switch (type) {
      case AlertDialogAction.ALERT:
        return this.openAlertNotificationDetails(data);
    }
  }

  public openPdfModal(type:DisplayPdfAction, data:DisplayPdfModel) {
    switch (type) {
      case DisplayPdfAction.VIEW:
        return this.openPdfModalContent(data);
    }
  }

  private openStatusChangeDialog(data:DialogDataModel):Observable<boolean> {
    data.dialogTitle = data.dialogTitle || "Change Status";
    const dialogRef = this.dialog.open(ActiveInactiveDialogComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data
    });
    return dialogRef.afterClosed();
  }

  private openDeleteDialog(data:DialogDataModel):Observable<boolean> {
    data.dialogTitle = data.dialogTitle || "Delete Item";
    const dialogRef = this.dialog.open(ActiveInactiveDialogComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAddNumberDialog(data:DialogAddSMS):Observable<boolean> {
    data.dialogTitle = data.dialogTitle;
    data.communityId = data.communityId;
    const dialogRef = this.dialog.open(AddInputDialogeComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAddEmailDialog(data:DialogAddSMS):Observable<boolean> {
    data.dialogTitle = data.dialogTitle;
    data.communityId = data.communityId;
    const dialogRef = this.dialog.open(AddEmailDialogeComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAddSmsAdmin(data:DialogAddSMS):Observable<boolean> {
    data.dialogTitle = data.dialogTitle;
    const dialogRef = this.dialog.open(AdminSmsComponent, {
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAddEmailAdmin(data:DialogAddSMS):Observable<boolean> {
    data.dialogTitle = data.dialogTitle;
    const dialogRef = this.dialog.open(AdminEmailComponent, {
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openEditSMSEmailDialog(data:DialogAddSMS):Observable<boolean> {
    data.dialogTitle = data.dialogTitle;
    data.communityId = data.communityId;
    const dialogRef = this.dialog.open(EditSMSEMailComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAlertDialogContent(data:AlertDialogDataModel):Observable<boolean> {
    data.dialogTitle = data.dialogTitle || "";
    const dialogRef = this.dialog.open(DialogComponent, {
      //width: '350px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAlertNotification(data:AlertDialogDataModel):Observable<boolean> {
    data.dialogTitle = data.dialogTitle || "";
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openAlertNotificationDetails(data:AlertDialogNotificationDataModel):Observable<boolean> {
    data.title = data.title || 'N/A';
    data.dialogTitle = data.dialogTitle || 'N/A';
    data.dialogMessage = data.dialogMessage || 'N/A'
    const dialogRef = this.dialog.open(NotificationDetailsComponent, {
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

  private openPdfModalContent(data:DisplayPdfModel):Observable<boolean> {
    data.dialogTitle = data.dialogTitle || "";
    const dialogRef = this.dialog.open(PdfViewModalComponent, {
      // width: '800px',
      // height: '600px',
      closeOnNavigation: true,
      hasBackdrop: true,
      data: data,
    });
    return dialogRef.afterClosed();
  }

}
