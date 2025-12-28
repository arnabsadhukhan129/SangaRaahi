import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Feedback } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import {DialogDataModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogAction} from "../../../../../../shared/enums/common.enums";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  feedbacks: Array<Feedback>;
  matTableDataSource: MatTableDataSource<Feedback>;
  displayedColumns: string[];
  current: number = 1;
  total: number;
  column:String;
  sorting:String;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService: DialogService
  ) { }


  ngOnInit(): void {
    this.getAllFeedbacks(this.current);
  }

  @ViewChild(MatSort) sort: MatSort;
  
  getAllFeedbacks(page:Number,columnName:String = '',sort:String = '') {
    const params:any = {data:{}};
    params.data = {
      page : page,
      // columnName : columnName,
      // sort : sort
    }
    
    this.loader.show();
    this.apollo.setModule('getAllFeedbacks').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.feedbacks = response.data.feedbacks; 
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }
        this.matTableDataSource = new MatTableDataSource<Feedback>(this.feedbacks);
        this.displayedColumns = ['no','Contact', 'Subject',  'Message', 'Status', 'Actions'];
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getAllFeedbacks(this.current,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getAllFeedbacks(this.current,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getAllFeedbacks(this.current,this.column,this.sorting);
  }

  deleteFeedback(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"Feedback",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteFeedback').mutateData({data:{"id": id}}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success("Deleted Successfully.");
            // Remove the row from the array
            this.feedbacks.splice(index, 1);
            this.matTableDataSource.data = this.feedbacks;
          }
          this.loader.hide();
        });
      }
      
    });
  }

}
