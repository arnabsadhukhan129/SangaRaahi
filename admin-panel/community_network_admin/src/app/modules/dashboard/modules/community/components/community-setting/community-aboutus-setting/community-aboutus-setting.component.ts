import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { AboutUsSettingViewComponent } from '../view-modal/about-us/about-us.component';

//declare var window:any;

@Component({
  selector: 'app-community-aboutus-setting',
  templateUrl: './community-aboutus-setting.component.html',
  styleUrls: ['./community-aboutus-setting.component.scss']
})
export class CommunityAboutUsSettingComponent implements OnInit {
  communityId: any;
  settingData: any;
  boardMembers: any = [];
  executiveMembers: any = [];
  boardMemberList: any = [];
  executiveMemberList: any = [];
  communityMemberApproval: any = [];
  changedPermission : boolean = false;
  @Output() dataEvent = new EventEmitter();
  //boardMembersLoaded : boolean = false;
  //executiveMembersLoaded : boolean = false;


  constructor(
    private builder : UntypedFormBuilder,
    private activatedRoute:ActivatedRoute,
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.activatedRoute.paramMap.subscribe((params)=>{
      this.communityId = params.get('id')
    })
  }

  ngOnInit(): void {
    this.getCommunityDetails();
    this.getBoardMemberList();
    this.getExecutiveMemberList();
/*
    this.getMemberList("board_member").then(data=>{
      this.boardMembers = data;
      this.boardMembersLoaded = true;

      this.boardMembers.filter((element:any)=>(
        this.communityMemberApproval.push(
        {
          memberId: element.members.memberId,
          isApprove: element.members.isAdminApproved ? true : false
        }
        )

      ));


     // console.log('boardMembers:',this.communityMemberApproval);



    });


    this.getMemberList("executive_member").then(data=>{
      this.executiveMembers = data;
      this.executiveMembersLoaded = true;

     this.executiveMembers.filter((element:any)=>(
      this.communityMemberApproval.push(
      {
        memberId: element.members.memberId,
        isApprove: element.members.isAdminApproved ? true : false
      }
      )
      ));


      //console.log('executiveMembers:',this.communityMemberApproval);
    });
*/

  }

  getCommunityDetails(){
    const params = {
      data: {
        id: this.communityId,
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule('getOrgPageAdminApproval').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.settingData = response.data;
      }
      });
  }

  getMemberList(memberType: String)
  {

    const customPromise = new Promise((resolve, reject)=>{

          let memberList : any = [];

          const params = {
            data: {
              communityId: this.communityId,
              memberType: memberType,
              "search": null,
              "isOrgPortal": false
            }
          }
          this.loaderService.show();
          this.apolloClient.setModule('communityMemberRoleFilter').queryData(params).subscribe((response: GeneralResponse) => {
            this.loaderService.hide();
            if(response.error) {
              //this.alertService.error(response.message);
              reject(this.alertService.error(response.message));
            }
            else
            {
              memberList = response.data;
              resolve(memberList);
            }
            });

    });


    return customPromise;

  }

  getBoardMemberList()
  {
          //let memberList : any = [];

          const params = {
            data: {
              communityId: this.communityId,
              memberType: "board_member",
              "search": null,
              "isOrgPortal": false
            }
          }
          this.loaderService.show();
          this.apolloClient.setModule('communityMemberRoleFilter').queryData(params).subscribe((response: GeneralResponse) => {
            this.loaderService.hide();
            if(response.error) {
              this.alertService.error(response.message);
            }
            else
            {
              this.boardMemberList = [];
              this.boardMembers = response.data;

              this.boardMembers.map((element:any)=>(
                  this.boardMemberList.push(
                  {
                    memberId: element.members.memberId,
                    isApprove: element.members.isAdminApproved ? true : false
                  }
                  )

                ));

            }
            });



  }

  getExecutiveMemberList()
  {
         // let memberList : any = [];

          const params = {
            data: {
              communityId: this.communityId,
              memberType: "executive_member",
              "search": null,
              "isOrgPortal": false
            }
          }
          this.loaderService.show();
          this.apolloClient.setModule('communityMemberRoleFilter').queryData(params).subscribe((response: GeneralResponse) => {
            this.loaderService.hide();
            if(response.error) {
              this.alertService.error(response.message);
            }
            else
            {
                this.executiveMemberList = [];
                this.executiveMembers = response.data;

                this.executiveMembers.map((element:any)=>(
                  this.executiveMemberList.push(
                  {
                    memberId: element.members.memberId,
                    isApprove: element.members.isAdminApproved ? true : false
                  }
                  )
                  ));

            }
            });



  }

  updateData(value: string){

    if(!this.changedPermission)
    {
      this.communityMemberApproval = [...this.boardMemberList, ...this.executiveMemberList];
    }
    //console.log('all:',this.communityMemberApproval);

    const params:any={};
    params['data']  =
      {
        communityId: this.communityId,
        communityLocationApproval:this.settingData.isApproveCommunityAddress,
        communityEmailApproval:this.settingData.isApproveCommunityEmailAddress,
        communityNumberApproval:this.settingData.isApproveCommunityPhoneNumber,
        communityMemberApproval:this.communityMemberApproval
      };

    this.loaderService.show();
    this.apolloClient.setModule("aboutPageAdminApproval").mutateData(params).subscribe((response:any) => {
      if(response.error){
        this.alertService.error(response.message);
      }
      else{
        this.alertService.success('About us page setting saved successfully');
        if(value === 'next'){
            this.goNext();
        }
        else{
          this.router.navigateByUrl('/dashboard/community');
        }
      }
      this.loaderService.hide();
    })

  }

  goNext()
  {
        this.dataEvent.emit(0);
  }


  setValue(type: string, e: any){

    if(type === 'isApproveCommunityAddress')
    {
      this.settingData.isApproveCommunityAddress = e.checked ? true : false;
    }
    else if(type === 'isApproveCommunityEmailAddress')
    {
      this.settingData.isApproveCommunityEmailAddress = e.checked ? true : false;
    }
    else if(type === 'isApproveCommunityPhoneNumber')
    {
      this.settingData.isApproveCommunityPhoneNumber = e.checked ? true : false;
    }
  }

  setMemebrsValue(memberId: string, e: any)
  {

    if(!this.changedPermission)
    {
      this.changedPermission = !this.changedPermission;
      this.communityMemberApproval = [...this.boardMemberList, ...this.executiveMemberList];
    }

    let index = this.communityMemberApproval.findIndex((ele : any) => ele.memberId === memberId);
    //console.log(memberId,'====',index, 'before : ',this.communityMemberApproval);
    this.communityMemberApproval[index].isApprove =  e.checked ? true : false;


    // this.communityMemberApproval.splice(index, 1);
    // this.communityMemberApproval.push({
    //   memberId: memberId,
    //   isApprove: e.checked ? true : false
    // });

   // console.log('newCommunityMemberApproval : ',this.communityMemberApproval);



    //console.log('after : ',this.communityMemberApproval);


  }


  openDialog(type:string, memberData:any = null): void {
    const dialogRef = this.dialog.open(AboutUsSettingViewComponent, {
     // height: '400px',
     // width: '600px',
      data: {type:type,communityId:this.communityId,content:this.settingData, members:this.communityMemberApproval, memberData:memberData},
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getCommunityDetails();
      this.getBoardMemberList();
      this.getExecutiveMemberList();
    });
  }

}
