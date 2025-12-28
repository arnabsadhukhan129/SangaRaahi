import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Announcement } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import {DialogDataModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogAction} from "../../../../../../shared/enums/common.enums";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-announcement-list',
  templateUrl: './announcement-list.component.html',
  styleUrls: ['./announcement-list.component.scss']
})
export class AnnouncementListComponent implements OnInit {
  announcement: Array<Announcement>;
  matTableDataSource: MatTableDataSource<Announcement>;
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
    this.getAllAnnouncement(this.current);
  }

  @ViewChild(MatSort) sort: MatSort;
  
  eventSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getAllAnnouncement(this.current,sortState.active,sortState.direction);
  }

  getAllAnnouncement(page:Number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {data:{}};
    this.search = search;
    params.data = {
      search:search ? search : '',
      page : page,
      columnName : columnName,
      sort : sort
    }
    
    
    this.loader.show();
    this.apollo.setModule('getAllAnnouncement').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.announcement = response.data.announcements;
        this.loggedUser = response.data.loggeduser;        
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }
        this.matTableDataSource = new MatTableDataSource<Announcement>(this.announcement);
        this.displayedColumns = ['no','AnnouncementName', 'CommunityName', 'AnnouncementType', 'EndDate','Status', 'Actions'];
      }
    });
  }

  public onGoTo(page: number): void {
    this.current = page
    this.getAllAnnouncement(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getAllAnnouncement(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getAllAnnouncement(this.current,this.search,this.column,this.sorting);
  }

  markActiveInactive(id:string, index:number, action:string) {
    const data: DialogDataModel = {
      contentName:"Announcement",
      actionName:action
    }
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        const params = {
          announcementStatusChangeId: {
            id: id
          }
        }
        this.loader.show();
        this.apollo.setModule('announcementStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if (response.error) {
            this.alertService.error(response.message);
          } else {
            // this.alertService.success(response.message);
            this.alertService.success("Event status chnaged successfully.");
            // Now change the element active status
            this.announcement[index].isActive = !this.announcement[index].isActive;
          }
        });
      }
    });
  }
  viewAnnouncement(id:string){
    this.router.navigateByUrl('dashboard/announcement/view/'+id);
  }

  editAnnouncement(id:string){
    this.router.navigateByUrl('dashboard/announcement/edit/'+id);
  }

  deleteAnnouncement(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"Announcement",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteAnnouncement').mutateData({"deleteAnnouncementId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.announcement.splice(index, 1);
            this.matTableDataSource.data = this.announcement;
          }
          this.loader.hide();
        });
      }
      
    });
  }

}
