import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { PaymentDetailComponent } from '../view-modal/payment-detail/payment-detail.component';


@Component({
  selector: 'app-community-payment-setting',
  templateUrl: './community-payment-setting.component.html',
  styleUrls: ['./community-payment-setting.component.scss']
})
export class CommunityPaymentSettingComponent implements OnInit {
  communityId: any;
  settingData: any;
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
    this.getCommunityDetails();
  }

  getCommunityDetails(){
    const params = {
      data: {
        id: this.communityId,
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule('getOrgPaymentPageAdminApproval').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();    
      if(response.error) {
        //this.alertService.error(response.message);
        //console.log('---',response);
      } else {
        this.settingData = response.data;

        //console.log('---',this.settingData);
      }
      });
  }

  updateData(value: string){
    const params:any={};
    params['data']  = 
      {
        communityId: this.communityId,
        authorityNameIsApproved:this.settingData.authorityNameIsApproved,
        otherpaymentLinkIsApproved:this.settingData.otherpaymentLinkIsApproved,
        paymentDescriptionIsApproved:this.settingData.paymentDescriptionIsApproved,
        qrcodeIsApproved:this.settingData.qrcodeIsApproved
      };

    this.loaderService.show();
    this.apolloClient.setModule("orgPaymentPageAdminApproval").mutateData(params).subscribe((response:any) => {
      if(response.error){
        this.alertService.error(response.message);
      }
      else{
        this.alertService.success('Donation page setting saved successfully');
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
        this.dataEvent.emit(3);
  }

  setValue(type: string, e: any){ 

    if(type === 'qrcodeIsApproved')
    {
      this.settingData.qrcodeIsApproved = e.checked ? true : false;
    }
    else if(type === 'paymentDescriptionIsApproved')
    {
      this.settingData.paymentDescriptionIsApproved = e.checked ? true : false;
    }
    else if(type === 'authorityNameIsApproved')
    {
      this.settingData.authorityNameIsApproved = e.checked ? true : false;
    }
    else if(type === 'otherpaymentLinkIsApproved')
    {
      this.settingData.otherpaymentLinkIsApproved = e.checked ? true : false;
    }
  }

 

  openDialog(type:string): void {
    const dialogRef = this.dialog.open(PaymentDetailComponent, {
      height: '400px',
      width: '600px',
      data: {type:type,communityId:this.communityId,content:this.settingData},
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getCommunityDetails();
    });
  }

}
