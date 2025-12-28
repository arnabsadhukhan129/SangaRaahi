import { Component, Inject, OnInit } from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DialogAction, DialogActionAdd } from 'src/app/shared/enums/common.enums';
import { DialogAddSMS, DialogDataModel } from 'src/app/shared/models/dialog-data.model';
@Component({
  selector: 'app-edit-sms-email',
  templateUrl: './edit-sms-email.component.html',
  styleUrls: ['./edit-sms-email.component.scss']
})
export class EditSMSEMailComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<EditSMSEMailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDataModel,
    private dialogService: DialogService) { }

  ngOnInit(): void {
  }

  smsEdit(val:any) {
    const data: DialogAddSMS = {
      dialogTitle: "Edit amount of sms credit",
      contentName: "SMS",
      actionName: "Add Sms",
      communityId: val.communityId,
      smsRemaining: val.smsRemaining,
      emailRemaining: val.emailRemaining,
      communityDescription: val.communityDescription
    }; 
    this.dialogService.openAddInputDialog(DialogActionAdd.AddSMS, data);
    this.dialogRef.close(true);
  }

  EmailEdit(val:any){
    const data: DialogAddSMS = {
      dialogTitle: "Edit amount of email credit",
      contentName: "Email",
      actionName: "Add Email",
      communityId: val.communityId,
      smsRemaining: val.smsRemaining,
      emailRemaining: val.emailRemaining,
      communityDescription: val.communityDescription
    }; 
    this.dialogService.openAddInputDialog(DialogActionAdd.AddEmail, data);
    this.dialogRef.close(true);
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }
  
}
