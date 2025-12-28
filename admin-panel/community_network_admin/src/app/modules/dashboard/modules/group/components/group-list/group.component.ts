import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Group } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import {DialogDataModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogAction} from "../../../../../../shared/enums/common.enums";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';
@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  groups: Array<Group>;
  matTableDataSource: MatTableDataSource<Group>;
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
    this.getAllGroups(this.current);
  }

  @ViewChild(MatSort) sort: MatSort;
  
  groupSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getAllGroups(this.current,this.search,sortState.active,sortState.direction);
  }

  getAllGroups(page:Number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {data:{}};
    this.search = search;
    params.data = {
      search:search ? search : '',
      page : page,
      columnName : columnName,
      sort : sort
    }
    
    this.loader.show();
    this.apollo.setModule('getAllGroup').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.groups = response.data.groups;
        this.loggedUser = response.data.loggeduser;        
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }
        this.matTableDataSource = new MatTableDataSource<Group>(this.groups);
        this.displayedColumns = ['no','GroupName', /*'GroupDescription',*/ 'GroupImage','CommunityName', 'CreatedBy', 'Member Add', 'Status', 'Actions'];
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getAllGroups(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getAllGroups(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getAllGroups(this.current,this.search,this.column,this.sorting);
  }

  deleteGroup(id:string, index:number){
    const params = {
      data: {
        id: id
      }
    };
    
    const data: DialogDataModel = {
      contentName:"Group",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteGroup').mutateData(params).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.groups.splice(index, 1);
            this.matTableDataSource.data = this.groups;
          }
          this.loader.hide();
        });
      }
      
    });
  }

  inactive(id:string){
    if(confirm("Are you sure you want to inactive this Group?")){
      const params = {
        groupStatusChangeId: id
      };
      this.loader.show();
      this.apollo.setModule('groupStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
        this.loader.hide();
        if(response.error) {
          this.alertService.error(response.message);
        } else {
          this.alertService.success(response.message);
        }
      });
    }

  }

  active(id:string){
    if(confirm("Are you sure you want to active this Group?")){
      const params = {
        groupStatusChangeId: id
      }
      this.loader.show();
      this.apollo.setModule('groupStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
        this.loader.hide();
        if(response.error) {
          this.alertService.error(response.message);
        } else {
          this.alertService.success(response.message);
        }
      });
    }

  }

  editGroup(id:string){
    this.router.navigateByUrl('dashboard/group/edit/'+id);
  }

  viewGroup(id:string){
    this.router.navigateByUrl('dashboard/group/view/'+id);
  }

  memberAdd(id:string){
    this.router.navigateByUrl('dashboard/group/member-add/'+id);
  }

  groupMember(id:string){
    this.router.navigateByUrl('dashboard/group/member/'+id);
  }

  markActiveInactive(id:string, index:number, action:string) {
    const data: DialogDataModel = {
      contentName:"Group",
      actionName:action
    }
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        const params = {
          groupStatusChangeId: id
        }
        this.loader.show();
        this.apollo.setModule('groupStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if (response.error) {
            this.alertService.error(response.message);
          } else {
            // this.alertService.success(response.message);
            this.alertService.success("Group status changed successfully.");
            // Now change the element active status
            this.groups[index].isActive = !this.groups[index].isActive;
          }
        });
      }
    });
  }

}
