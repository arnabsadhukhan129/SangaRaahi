import { Component, OnInit, Inject } from '@angular/core';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
})
export class AboutUsSettingViewComponent {

 // communityMemberApproval: any = [];
  memberDetail : any = {};

  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private domSanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<AboutUsSettingViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) 
  { }

  ngOnInit(): void {
   console.log('---->', this.data);
   this.memberDetail = this.data.memberData;
   //this.communityMemberApproval =  this.data.members;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  /*
  updateApprovalStatus(value:any, id:string): void
  {

    if(this.data.type=='executiveMembers' || this.data.type=='boardMembers')
    {
        let index = this.communityMemberApproval.findIndex((ele : any) => ele.memberId === this.memberDetail.members.memberId);
        this.communityMemberApproval[index].isApprove =  value;
    }
          const params:any={};
          params['data']  = 
            {
              communityId: this.data.communityId,
              communityLocationApproval:this.data.type=='isApproveCommunityAddress' ? value : this.data.content.isApproveCommunityAddress,
              communityEmailApproval:this.data.type=='isApproveCommunityEmailAddress' ? value : this.data.content.isApproveCommunityEmailAddress,
              communityNumberApproval:this.data.type=='isApproveCommunityPhoneNumber' ? value : this.data.content.isApproveCommunityPhoneNumber,
              communityMemberApproval:this.communityMemberApproval
            };
      
          this.loaderService.show();
          this.apolloClient.setModule("aboutPageAdminApproval").mutateData(params).subscribe((response:any) => {
            if(response.error){
              this.alertService.error(response.message);
            }
            else{
              this.alertService.success('About us page setting saved successfully');
              this.closeDialog();
            }
            this.loaderService.hide();
          })
   

  }
  */
}
