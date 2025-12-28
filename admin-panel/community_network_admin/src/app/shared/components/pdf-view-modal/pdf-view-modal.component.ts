import {Component, Inject, OnInit} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {DisplayPdfModel} from "../../models/dialog-data.model";
import {LoaderService} from 'src/app/shared/services/loader.service';
import {ApolloClientService} from 'src/app/shared/services/apollo-client.service';
import {AlertService} from 'src/app/shared/services/alert.service';
import {GeneralResponse} from 'src/app/shared/interfaces/general-response.ineterface';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-view-modal',
  templateUrl: './pdf-view-modal.component.html',
  styleUrls: ['./pdf-view-modal.component.scss']
})
export class PdfViewModalComponent implements OnInit {

  fileExtension : string = '';
  complete_url : string = '';
  safeSrc : any;
  startLoader: boolean = false;

  constructor(public dialogRef: MatDialogRef<PdfViewModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DisplayPdfModel,
              private loader: LoaderService,
              private apollo: ApolloClientService,
              private alertService: AlertService,
              private sanitizer: DomSanitizer
              ) { }

  ngOnInit(): void {

    this.fileExtension = this.getFileExtension(this.data.pdfLink); 
    console.log('this.fileExtension : ',this.fileExtension);

    if(this.fileExtension == 'docx' || this.fileExtension == 'doc'  || this.fileExtension == 'xls' || this.fileExtension == 'xlsx')
    {
         this.startLoader = true;
         this.complete_url ='http://docs.google.com/gview?url=' + encodeURIComponent(this.data.pdfLink) + '&embedded=true';
         this.safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.complete_url);
         this.startLoader = false;
         //console.log(this.complete_url);
     }
  }

  changeStatus(type: boolean) 
  {
        const params = {
          "data": {
            "id": this.data.communityId,
            "isApprove": type
          }
        }
        this.loader.show();
        this.apollo.setModule('bankDetailsAdminStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          
          if (response.error) {
            this.loader.hide();
            this.alertService.error(response.message);
          } 
          else 
          {
            this.loader.hide();
            this.alertService.success('Status has been changed successfully.');
            this.dialogRef.close(true);
          }

          
        });
        
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  getFileExtension(filename : any)
  {

    const extension = filename.split('.').pop();
    return extension;
  }
}
