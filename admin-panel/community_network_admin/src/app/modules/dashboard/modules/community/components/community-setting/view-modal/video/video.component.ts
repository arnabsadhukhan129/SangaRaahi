import { Component, OnInit, Inject } from '@angular/core';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent {
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private domSanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<VideoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) 
  { }

  ngOnInit(): void {
    console.log('---->', this.data);

        this.data.content.hlink = this.domSanitizer.bypassSecurityTrustResourceUrl(this.data.content.link);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateApprovalStatus(value:any, id:string): void
  {
          const params:any={};
          params['data']  = {
            id: id,
            isApprove: value
          }

          this.loaderService.show();
          this.apolloClient.setModule("videoSettingsAdminApproval").mutateData(params).subscribe((response:any) => {
            if(response.error){
              this.alertService.error(response.message);
            }
            else{
              this.alertService.error("Video page setting saved successfully");
              this.closeDialog();
            }
            this.loaderService.hide();
          })
   

  }
}
