import { Component, Inject, OnInit } from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {AlertDialogDataModel} from "../../models/dialog-data.model";
import { LoaderService } from '../../services/loader.service';
import { ApolloClientService } from '../../services/apollo-client.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { Notification } from 'src/app/shared/typedefs/custom.types';
import { GeneralResponse } from '../../interfaces/general-response.ineterface';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialogComponent implements OnInit {
  notifications: Array<Notification>;
  current: number = 1;
  
  constructor(public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataModel,
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService: DialogService
  ) { 
      dialogRef.disableClose = true;
    }

  ngOnInit(): void {
    this.getNotificationDetails(this.current);
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

  getNotificationDetails(page:Number,columnName:String = '',sort:String = ''){
    const params:any = {};
    params['data'] = {
      columnName: columnName,
      page:page,
      sort:sort,
      limit: 10
    }
    this.apollo.setModule('getAllNotificationsForDotCom').queryData(params).subscribe((response: GeneralResponse) => {
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.notifications = response.data.notifications;
      }
    });
  }

  redirect(){
    this.router.navigateByUrl('dashboard/notification/list');
    this.dialogRef.close();
  }

}
