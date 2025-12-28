import { Component, Inject, OnInit } from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {AlertDialogNotificationDataModel} from "../../models/dialog-data.model";
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-notification-details',
  templateUrl: './notification-details.component.html',
  styleUrls: ['./notification-details.component.scss']
})
export class NotificationDetailsComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogNotificationDataModel) { }

  ngOnInit(): void {
  }

  onYesClick() {
    this.dialogRef.close(true);
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

}
