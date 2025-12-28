import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Notification } from 'src/app/shared/typedefs/custom.types';
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';
import {AlertDialogAction, DialogAction} from "src/app/shared/enums/common.enums";
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import {DialogDataModel, AlertDialogDataModel, DisplayPdfModel, AlertDialogNotificationDataModel} from 'src/app/shared/models/dialog-data.model';
import {Community} from 'src/app/shared/typedefs/custom.types';
import { CommonService } from '../../../services/common.service';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public communities: Array<Community>;
  notifications: Array<Notification>;
  matTableDataSource: MatTableDataSource<Notification>;
  displayedColumns: string[];
  current: number = 1;
  total: number;
  column:String;
  sorting:String;
  loggedUser:String;
  search:String;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService: DialogService,
    private CommonService: CommonService
  ) { }

  @ViewChild(MatSort) sort: MatSort;

  notificationSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getNotificationDetails(this.current,sortState.active,sortState.direction);
  }

  ngOnInit(): void {
    this.getNotificationDetails(this.current);
  }

  getNotificationDetails(page:Number,columnName:String = '',sort:String = ''){
    const params:any = {};
    params['data'] = {
      columnName: columnName,
      page:page,
      sort:sort,
      limit: 10
    }
    this.loader.show();
    this.apollo.setModule('getAllNotificationsForDotCom').queryData(params).subscribe((response: GeneralResponse) => {
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.notifications = response.data.notifications;
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }   
      }
      this.matTableDataSource = new MatTableDataSource<Notification>(this.notifications);
      this.displayedColumns = ['no','Message', 'Send', 'Actions'];
      this.loader.hide();
    });
  }

  public onGoTo(page: number): void {
    this.current = page;
    this.getNotificationDetails(this.current,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1;
    this.getNotificationDetails(this.current,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1;
    this.getNotificationDetails(this.current,this.column,this.sorting);
  }

  viewDetails(details:any){
    console.log(details?.text);
    const data: AlertDialogNotificationDataModel = {
      title: "Notification Details",
      dialogTitle: details?.subject,
      dialogMessage: details?.text
    };
    this.dialogService.openNotificationDetailsDialog(AlertDialogAction.ALERT, data).subscribe(result => {
      if(result) {
      }
    });
  }

  redirectToApprovalPage(element: any){
    if(element?.communityId && element?.slug){  
      if(element?.section === 'home'){
        this.CommonService.sendValue(0);
      }
      if(element?.section === 'about'){
        this.CommonService.sendValue(3);
      }
      if(element?.section === 'payment'){
        this.CommonService.sendValue(2);
      }
      if(element?.section === 'video'){
        this.CommonService.sendValue(1);
      }
      this.router.navigateByUrl('dashboard/community/webpageApproval/'+ element?.communityId+'/'+ element?.slug);
    }
   
    
  }

 
}
