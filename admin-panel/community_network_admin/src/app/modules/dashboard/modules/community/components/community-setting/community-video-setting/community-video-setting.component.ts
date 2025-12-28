import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { VideoComponent } from '../view-modal/video/video.component';

declare var window:any;

@Component({
  selector: 'app-community-video-setting',
  templateUrl: './community-video-setting.component.html',
  styleUrls: ['./community-video-setting.component.scss']
})
export class CommunityVideoSettingComponent implements OnInit {
  communityId: any;
  getVideoSettingData: any;
  //communityVideoForm!: FormGroup;
  videoId!: string;
  isApprove: boolean = false;
  @Output() dataEvent = new EventEmitter();
  //$modal: any;

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
  }

  getCommunityDetails(){
    const params = {
      data: {
        id: this.communityId,
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule('getCommunityVideos').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.getVideoSettingData = response.data;
      }
      });
  }

  saveVideoTab(value: string){
    const params:any={};
    params['data']  = this.getVideoSettingData.map((ele: any) => (
      {
        id: ele.id,
        isApprove: ele.isApproved === true ? ele.isApproved : false
      }
    ));
    this.loaderService.show();
    this.apolloClient.setModule("videoSettingsAdminApproval").mutateData(params).subscribe((response:any) => {
      if(response.error){
        this.alertService.error(response.message);
      }
      else{
        this.alertService.error("Video page setting saved successfully");
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
        this.dataEvent.emit(2);
  }

  setValue(i: number, e: any){
    this.getVideoSettingData[i].isApproved = e.checked ? true : false;
  }

  // showVideo() {
  //   this.$modal = new window.bootstrap.Modal(
  //     document.getElementById("showVideoModal")
  //   );
  //   this.$modal.show();
  // }

  // closeModal(){
  //   this.$modal.show();
  // }

  openDialog(index:number): void {
    const dialogRef = this.dialog.open(VideoComponent, {
      height: '400px',
      width: '600px',
      data: {content: this.getVideoSettingData[index]},
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getCommunityDetails();
    });
  }

}
