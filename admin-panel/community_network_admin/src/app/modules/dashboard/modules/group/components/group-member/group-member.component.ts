import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { GroupMemberList } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import { MatLegacyTableDataSource as MatTableDataSource } from "@angular/material/legacy-table";
import { DialogDataModel } from "../../../../../../shared/models/dialog-data.model";
import { DialogService } from "../../../../../../shared/services/dialog.service";
import { DialogAction } from 'src/app/shared/enums/common.enums';

@Component({
  selector: 'app-group-member',
  templateUrl: './group-member.component.html',
  styleUrls: ['./group-member.component.scss']
})
export class GroupMemberComponent implements OnInit {
  public groupMember: Array<GroupMemberList>;
  public groupRequestMember: Array<GroupMemberList>;
  search:String;
  public userRole : string = "";
  public matTableDataSource: MatTableDataSource<GroupMemberList>;
  public matRequestTableDataSource: MatTableDataSource<GroupMemberList>;
  displayedColumns: string[];
  displayedRequestColumns : String[];
  reqtotal : number;
  total : number;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService:DialogService
  ) { }

  ngOnInit(): void {
    this.groupMemberList('');
  }

  //Group member list
  groupMemberList(search:String = '') {
    const id = this.route.snapshot.paramMap.get('id');
    const groupParams:any = {
      data:{
        id: id
      }
    };
    this.loader.show();
    this.apollo.setModule('groupUserRole').queryData(groupParams).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.userRole = "";
      }else{
        this.userRole = response.data.role;
      }
    });
    console.log(this.userRole);
    
    const params:any = {
      data:{
        groupId: id,
        memberType: [
          "fan",
          "member",
          "group_owner",
          "board_member",
          "executive_member"
        ],
        search:''
      }
    };
    this.search = search;
    if(search) {
      params.data.search = search;
      
    }

    this.loader.show();
    this.apollo.setModule('groupMemberList').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {      
        this.groupMember = response.data;
        this.total = response.data.length;
        this.matTableDataSource = new MatTableDataSource<GroupMemberList>(this.groupMember);
        if(this.userRole === 'group_owner') {
          this.displayedColumns = ['no','Name', 'Email', 'Phone','Image', 'Role','Actions'];
        }else{
          this.displayedColumns = ['no','Name', 'Email', 'Phone','Image', 'Role'];
        }
      }
    });
  }

  //Remove group member
  removeGroupMember(memberId:String,groupId:String, index:number){
    const data: DialogDataModel = {
      contentName:"Member",
      actionName:"permanently delete"
    };
    const params:any = {
      data: {
        groupId: groupId,
        memberIds: [memberId]
      }
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe((result: any) => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('removeGroupMember').mutateData(params).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.groupMember.splice(index, 1);
            this.matTableDataSource.data = this.groupMember;
          }
          this.loader.hide();
        });
      }
      
    });
  }

  //Get the group request list
  groupRequestList(search:String) {
    const id = this.route.snapshot.paramMap.get('id');
    const params:any = {
      data:{
        groupId: id,
        search:''
      }
    };
    this.search = search;
    if(search) {
      params.data.search = search;
      
    }
    this.loader.show();
    this.apollo.setModule('groupRequestList').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {      
        this.groupRequestMember = response.data;
        this.reqtotal = response.data.length;
        this.matRequestTableDataSource = new MatTableDataSource<GroupMemberList>(this.groupRequestMember);
        
        if(this.userRole === 'group_owner') {
          this.displayedRequestColumns = ['no','Name','RequestedDate','Image', 'Actions'];
        }else{
          this.displayedRequestColumns = ['no','Name','RequestedDate','Image'];
        }
      }
    });
  }

  //Approve or Reject member
  approveOrRejectMemberRequest(memberId:String, groupId:String, index:number, action:Boolean) {
    let actionName;
    if(action) {
      actionName = "accept";
    }else{
      actionName = "reject";
    }

    const data: DialogDataModel = {
      contentName:"Member",
      actionName:actionName
    };
    const params:any = {
      data: {
        groupId: groupId,
        approveStatus: action,
        memberId: memberId 
      }
    };
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe((result:any) => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('approveOrRejectGroupMemberRequest').mutateData(params).subscribe((response: GeneralResponse)=>{
          if(response.error) {
            this.alertService.error(response.message);
          }else {
            this.alertService.success(response.message);
            this.groupRequestMember.splice(index, 1);
            this.matRequestTableDataSource.data = this.groupRequestMember;
          }
          this.loader.hide();
        });
      }
    });
  }

  //For the tab change rendering
  tabClick(tab:any) {
    let i = tab.index;
    if(i === 0) {
      this.groupMemberList('');
    }else{
      this.groupRequestList('');
    }
  }


}
