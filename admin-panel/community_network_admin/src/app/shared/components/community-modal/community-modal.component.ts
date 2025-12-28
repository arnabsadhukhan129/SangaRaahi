import { Component, OnInit, Inject } from '@angular/core';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import {DialogService} from "../../services/dialog.service";
import {DialogDataModel} from "../../models/dialog-data.model";
import {DialogAction, AlertDialogAction, DisplayPdfAction} from "../../enums/common.enums";

@Component({
  selector: 'app-community-modal',
  templateUrl: './community-modal.component.html',
  styleUrls: ['./community-modal.component.scss'],
})
export class CommunityModalComponent {

  safeDescription!: SafeHtml;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private domSanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<CommunityModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogService:DialogService
  ) 
  { }

  ngOnInit(): void {
    // console.log('---->', this.data);

    if(this.data.type == 'Video' && this.data.content.field == 'video')
    {
        this.data.content.hlink = this.domSanitizer.bypassSecurityTrustResourceUrl(this.data.content.content);
    }

    // ✅ HTML CONTENT SANITIZATION
    if (this.data.content?.content) {
      this.data.content.safeHtml =
        this.domSanitizer.bypassSecurityTrustHtml(
          this.data.content.content
        );
    }
    if (this.data.content?.description) {
      this.safeDescription = this.domSanitizer.bypassSecurityTrustHtml(this.data.content.description);
    }
    
    
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateApprovalStatus(value:any, id:string): void
  {
    const data: DialogDataModel = {
      dialogTitle:value? "Approve " : "Reject " +this.data.content.fieldname,
      contentName:this.data.content.fieldname,
      actionName: value? "approve" : "reject"
    };

    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {

      if(result) {

        const params:any={};
        params['data']={
          id: id,
          isApprove: value
        }

        this.loaderService.show();
        this.apolloClient.setModule("adminLogApproval").mutateData(params).subscribe((response:any) => {    
          if(response.error){
            this.alertService.error(response.message);
          }
          else{
            this.alertService.success(response.message);
            this.closeDialog();
          }
          this.loaderService.hide();
        })

      }
      else
      {
            
      }
      
    });







        

  }
}
