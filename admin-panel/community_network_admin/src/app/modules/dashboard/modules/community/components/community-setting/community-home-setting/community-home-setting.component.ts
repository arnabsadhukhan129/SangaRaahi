import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { HomeSettingViewComponent } from '../view-modal/home/home.component';

@Component({
  selector: 'app-community-home-setting',
  templateUrl: './community-home-setting.component.html',
  styleUrls: ['./community-home-setting.component.scss']
})
export class CommunityHomeSettingComponent implements OnInit {
  communityHomeForm!: UntypedFormGroup;
  communityId: any;
  getHomeSettingData: any;
  @Output() dataEvent = new EventEmitter();

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
    this.initForm();
    this.getCommunityDetails();
  }

  initForm(){
    this.communityHomeForm = this.builder.group({
      logoImageApproval: [false],
      bannerImageApproval: [false],
      communityDescriptionApproval: [false],
    })
  }

  saveHomeTab(value:string){
    const params:any={};
    params['data']={
      communityId: this.communityId,
      bannerImageApproval: this.communityHomeForm.value.bannerImageApproval,
      logoImageApproval: this.communityHomeForm.value.logoImageApproval,
      communityDescriptionApproval: this.communityHomeForm.value.communityDescriptionApproval
    }
    this.loaderService.show();
    this.apolloClient.setModule("orgHomePageAdminApproval").mutateData(params).subscribe((response:any) => {
      if(response.error){
        this.alertService.error(response.message);
      }
      else{
        this.alertService.error("Home page setting saved successfully");
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
        this.getHomeSettingData = response.data;
        this.patchData(this.getHomeSettingData);
      }
      });
  }

  patchData(getDetails:any){
    this.communityHomeForm.patchValue({
      logoImageApproval: getDetails.isApproveCommunityLogoImage ? getDetails.isApproveCommunityLogoImage : false,
      bannerImageApproval: getDetails.isApproveCommunityBannerImage ? getDetails.isApproveCommunityBannerImage : false,
      communityDescriptionApproval: getDetails.isApproveCommunityDescription ? getDetails.isApproveCommunityDescription : false,
    })
  }

  goNext()
  {
        this.dataEvent.emit(1);
  }

  openDialog(type:string): void {
    const dialogRef = this.dialog.open(HomeSettingViewComponent, {
     // height: '400px',
     // width: '600px',
      data: {type:type,communityId:this.communityId,content:this.getHomeSettingData},
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getCommunityDetails();
    });
  }

}
