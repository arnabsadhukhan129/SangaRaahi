import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Event } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import {DialogDataModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogAction} from "../../../../../../shared/enums/common.enums";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {
  events: Array<Event>;
  matTableDataSource: MatTableDataSource<Event>;
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
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.getAllEvents(this.current);
  }

  @ViewChild(MatSort) sort: MatSort;
  
  eventSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getAllEvents(this.current,this.search,sortState.active,sortState.direction);
  }

  getAllEvents(page:Number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {data:{}};
    this.search = search;
    params.data = {
      search:search ? search : '',
      page : page,
      columnName : columnName,
      sort : sort
    }
    
    
    this.loader.show();
    this.apollo.setModule('getAllEvents').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.events = response.data.events;
        console.log(this.events);
        this.loggedUser = response.data.loggeduser;        
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }
        this.matTableDataSource = new MatTableDataSource<Event>(this.events);
        this.displayedColumns = ['no','EventName', 'EventImage', 'CommunityName', 'CreateBy', 'Status', 'Actions'];
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getAllEvents(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getAllEvents(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getAllEvents(this.current,this.search,this.column,this.sorting);
  }

  markActiveInactive(id:string, index:number, action:string) {
    const data: DialogDataModel = {
      contentName:"Event",
      actionName:action
    }
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        const params = {
          eventStatusChangeId: id
        }
        this.loader.show();
        this.apollo.setModule('eventStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if (response.error) {
            this.alertService.error(response.message);
          } else {
            // this.alertService.success(response.message);
            this.alertService.success("Event status chnaged successfully.");
            // Now change the element active status
            this.events[index].isActive = !this.events[index].isActive;
          }
        });
      }
    });
  }

  deleteEvent(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"Event",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteEvent').mutateData({"deleteEventId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.matTableDataSource.data = this.events;
          }
          this.loader.hide();
        });
      }
      
    });
  }

  viewEvent(id:string){
    this.router.navigateByUrl('dashboard/event/view/'+id);
  }

  editEvent(id:string){
    this.router.navigateByUrl('dashboard/event/edit/'+id);
  }
  

}
