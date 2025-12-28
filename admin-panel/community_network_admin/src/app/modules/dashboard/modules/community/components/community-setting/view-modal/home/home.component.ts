import { Component, OnInit, Inject } from '@angular/core';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeSettingViewComponent {
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private domSanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<HomeSettingViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) 
  { }

  ngOnInit(): void {
   console.log('---->', this.data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateApprovalStatus(value:any, id:string): void
  {
          const params:any={};
          params['data']={
            communityId: this.data.communityId,
            bannerImageApproval: this.data.type=='bannerImageApproval' ? value : this.data.content.isApproveCommunityBannerImage,
            logoImageApproval: this.data.type=='logoImageApproval' ? value : this.data.content.isApproveCommunityLogoImage,
            communityDescriptionApproval: this.data.type=='communityDescriptionApproval' ? value : this.data.content.isApproveCommunityDescription
          }
          this.loaderService.show();
          this.apolloClient.setModule("orgHomePageAdminApproval").mutateData(params).subscribe((response:any) => {
            if(response.error){
              this.alertService.error(response.message);
            }
            else{
              this.alertService.error("Home page setting saved successfully");
              this.closeDialog();
            }
            this.loaderService.hide();
          })
   

  }
}
