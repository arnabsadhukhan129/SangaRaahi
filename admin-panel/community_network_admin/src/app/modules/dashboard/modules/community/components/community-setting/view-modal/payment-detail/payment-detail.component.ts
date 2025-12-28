import { Component, OnInit, Inject } from '@angular/core';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss'],
})
export class PaymentDetailComponent {
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private domSanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<PaymentDetailComponent>,
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
          params['data']  = 
            {
              communityId: this.data.communityId,
              authorityNameIsApproved:  this.data.type=='orgAuthorityName' ? value : this.data.content.authorityNameIsApproved,
              otherpaymentLinkIsApproved: this.data.type=='orgLink' ? value : this.data.content.otherpaymentLinkIsApproved,
              paymentDescriptionIsApproved: this.data.type=='orgPaymentDescription' ? value : this.data.content.paymentDescriptionIsApproved,
              qrcodeIsApproved: this.data.type=='orgQrcodeImage' ? value : this.data.content.qrcodeIsApproved
            };

          this.loaderService.show();
          this.apolloClient.setModule("orgPaymentPageAdminApproval").mutateData(params).subscribe((response:any) => {
            if(response.error){
              this.alertService.error(response.message);
            }
            else{
              this.alertService.success('Donation page setting saved successfully');
              this.closeDialog();
            }
            this.loaderService.hide();
          })
   

  }
}
