import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserMain } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import { DialogDataModel } from "../../../../../../shared/models/dialog-data.model";
import { DialogService } from "../../../../../../shared/services/dialog.service";
import { DialogAction } from "../../../../../../shared/enums/common.enums";
import { MatLegacyTableDataSource as MatTableDataSource } from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  users: Array<UserMain>;
  public matTableDataSource: MatTableDataSource<UserMain>;
  displayedColumns: string[];
  current: number = 1;
  total: number;
  dataSource: any;
  column:String;
  sorting:String;
  search:String;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService:DialogService
  ) { }

  @ViewChild(MatSort) sort: MatSort;
  
  userSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getUsers(this.current,this.search,sortState.active,sortState.direction);
  }

  ngOnInit(): void {
    this.getUsers(this.current);
  }

  getUsers(page:Number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {};
    this.search = search;
    params['data'] = {
      search:search ? search : '',
      page:page,
      limit:10,
      columnName:columnName,
      sort:sort
    }
    this.loader.show();
    this.apollo.setModule('getAllUsers').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.users = response.data.users; 
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
          console.log("total=====",this.total);
          
        }else {
          this.total = 0;
        }       
        this.matTableDataSource = new MatTableDataSource<UserMain>(this.users);
        this.displayedColumns = ['no', 'Member Id', 'Name', 'Email', 'Phone', 'Image' , 'Status', 'Actions'];
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getUsers(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1;
    this.getUsers(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1;
    this.getUsers(this.current,this.search,this.column,this.sorting);
  }

  
  markActiveInactive(id:string, index:number, action:string) {
    const data: DialogDataModel = {
      contentName:"User",
      actionName:action
    }
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        const params = {
          userStatusChangeId: id
        }
        this.loader.show();
        this.apollo.setModule('userStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if (response.error) {
            this.alertService.error(response.message);
          } else {
            // this.alertService.success(response.message);
            this.alertService.success("User status changed successfully.");
            // Now change the element active status
            this.users[index].isActive = !this.users[index].isActive;
          }
        });
      }
    });
  }

  deleteUser(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"User",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteUser').mutateData({"deleteUserId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.users.splice(index, 1);
            this.matTableDataSource.data = this.users;
          }
          this.loader.hide();
        });
      }
      
    });
  }
  //

  
  editUser(id:string){
    this.router.navigateByUrl('dashboard/user/edit/'+id);
  }

  
  viewUser(id:string){
    this.router.navigateByUrl('dashboard/user/view/'+id);
  }

  resetPassword(id:string){
    const data: DialogDataModel = {
      dialogTitle: "Password Reset",
      contentName:"User",
      actionName:"Reset the Password of"
    };
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('resetUserPassword').mutateData({"resetUserPasswordId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            this.matTableDataSource.data = this.users;
          }
          this.loader.hide();
        });
      }
      
    });
  }
}
