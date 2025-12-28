import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { CommunityMemberList } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import { MatLegacyTableDataSource as MatTableDataSource } from "@angular/material/legacy-table";
import { DialogDataModel } from "../../../../../../shared/models/dialog-data.model";
import { DialogService } from "../../../../../../shared/services/dialog.service";
import { DialogAction } from 'src/app/shared/enums/common.enums';

@Component({
  selector: 'app-community-member',
  templateUrl: './community-member.component.html',
  styleUrls: ['./community-member.component.scss']
})
export class CommunityMemberComponent implements OnInit {
  public communityMember: Array<CommunityMemberList>;
  public communityRequestMember: Array<CommunityMemberList>;
  search:String;
  public userRole : string = "";
  public matTableDataSource: MatTableDataSource<CommunityMemberList>;
  public matRequestTableDataSource: MatTableDataSource<CommunityMemberList>;
  displayedColumns: string[];
  displayedRequestColumns : String[];
  reqtotal : number;
  total : number;
  current: number = 1;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService:DialogService
  ) { }

  ngOnInit(): void {
    this.communityMemberList('');
  }

  //Community member list
  communityMemberList(search:String = '') {
    const id = this.route.snapshot.paramMap.get('id');
    const commParams:any = {
      data:{
        id: id
      }
    };
    this.loader.show();
    this.apollo.setModule('communityUserRole').queryData(commParams).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.userRole = "";
      }else{
        this.userRole = response.data.role;

      }
    });

    const params:any = {
      data:{
        communityId: id,
        memberType: [
          "fan",
          "member",
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
    this.apollo.setModule('communityMemberList').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.communityMember = response.data;
        this.total = response.data.length;
        this.matTableDataSource = new MatTableDataSource<CommunityMemberList>(this.communityMember);
        if(this.userRole === 'board_member' || this.userRole === 'executive_member') {
          this.displayedColumns = ['no','Name', 'Email', 'Phone','Image', 'Role','Actions'];
        }else{
          this.displayedColumns = ['no','Name', 'Email', 'Phone','Image', 'Role'];
        }
      }
    });
  }


  //Remove community member
  removeCommunityMember(memberId:String,communityId:String, index:number){
    const data: DialogDataModel = {
      contentName:"Member",
      actionName:"permanently delete"
    };
    const params:any = {
      data: {
        communityId: communityId,
        memberId: [memberId]
      }
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe((result: any) => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('removeCommunityMember').mutateData(params).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.communityMember.splice(index, 1);
            this.matTableDataSource.data = this.communityMember;
          }
          this.loader.hide();
        });
      }

    });
  }

  //Get the community request list
  communityRequestList(page:Number,search:String) {
    const id = this.route.snapshot.paramMap.get('id');
    const params:any = {
      data:{
        communityId: id,
        page : page,
        search:''
      }
    };
    this.search = search;
    if(search) {
      params.data.search = search;

    }
    this.loader.show();
    this.apollo.setModule('communityRequestList').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.communityRequestMember = response.data?.communities;
        // this.reqtotal = response.data.length;
        if(response.data.total !== 0) {
          this.reqtotal = Math.ceil(response.data.total / 10);
        }else {
          this.reqtotal = 0;
        }
        this.matRequestTableDataSource = new MatTableDataSource<CommunityMemberList>(this.communityRequestMember);

        if(this.userRole === 'board_member' || this.userRole === 'executive_member') {
          this.displayedRequestColumns = ['no','Name','RequestedDate','Image', 'RequestedRole', 'Actions'];
        }else{
          this.displayedRequestColumns = ['no','Name','RequestedDate','Image', 'RequestedRole'];
        }
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.communityRequestList(this.current,this.search);
  }

  public onNext(page: number): void {
    this.current = page + 1
    this.communityRequestList(this.current,this.search);
  }

  public onPrevious(page: number): void {
    this.current = page - 1
    this.communityRequestList(this.current,this.search);
  }

  //Approve or Reject member
  approveOrRejectMemberRequest(memberId:String,communityId:String, index:number, action:Boolean) {
    let actionName;
    if(action) {
      actionName = "accept";
    }else {
      actionName = "reject";
    }
    const data: DialogDataModel = {
      contentName:"Member",
      actionName:actionName
    };
    const params:any = {
      data: {
        communityId: communityId,
        approveStatus: action,
        memberId: memberId
      }
    };
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe((result: any) => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('approveOrRejectMemberRequest').mutateData(params).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.communityRequestMember.splice(index, 1);
            this.matRequestTableDataSource.data = this.communityRequestMember;
          }
          this.loader.hide();
        });
      }

    });
  }

  //Promote or Demote community member
  PromoteOrDemoteCommunityMember( memberId:String, communityId:String, index:number, status:Boolean ) {
    let actionName;
    if(status) {
      actionName = "promote";
    }else {
      actionName = "demote";
    }
    const data: DialogDataModel = {
      contentName:"Member",
      actionName:actionName
    };
    const params:any = {
      data: {
        communityId: communityId,
        promote: status,
        memberId: memberId
      }
    };
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe((result: any) => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('promoteOrDemoteCommunityMember').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            let role = response.data.newRole;

            switch(role) {
              case "board_member":
                // code block
                role = "Board Member"
                break;
              case "executive_member":
                // code block
                role = "Executive Member";
                break;
              case "member":
                // code block
                role = "Member";
                break;
              case "fan":
              // code block
              role = "Fan";
              break;
            }
            this.communityMember[index].members.roles = role;
          }

        });
      }

    });
  }

  //For the tab change rendering
  tabClick(tab:any) {
    let i = tab.index;
    if(i === 0) {
      this.communityMemberList('');
    }else{
      this.communityRequestList(this.current,'');
    }
  }
}



