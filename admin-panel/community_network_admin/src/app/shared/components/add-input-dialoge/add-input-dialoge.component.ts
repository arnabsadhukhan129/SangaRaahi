import { Component, Inject, OnInit } from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {DialogAddSMS, DialogDataModel} from "../../models/dialog-data.model";
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';
import { ApolloClientService } from '../../services/apollo-client.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { SmsEmailRemainingService } from '../../services/sms-email-remaining.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-add-input-dialoge',
  templateUrl: './add-input-dialoge.component.html',
  styleUrls: ['./add-input-dialoge.component.scss']
})
export class AddInputDialogeComponent implements OnInit {
  creditForm!:UntypedFormGroup;
  saveRemainingSMSBalance: any;
  safeDescription!: SafeHtml;

  constructor(
    public dialogRef: MatDialogRef<AddInputDialogeComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogAddSMS,
              private formBuilder : UntypedFormBuilder,
              private loader: LoaderService,
              private apollo: ApolloClientService,
              private alertService: AlertService,
              private router: Router,
              private SmsEmailRemainingService: SmsEmailRemainingService,
              private sanitizer: DomSanitizer
  ) { 
  }

  ngOnInit(): void {
    this.initForm();
    // this.getRemainingCreditBalance();
    // if(this.data.smsRemaining){
    //   this.patchData();
    // }
    if (this.data.communityDescription) {
      this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(this.data.communityDescription);
    }
  }

  initForm(){
    this.creditForm  = this.formBuilder.group({
      smsCredits: ['']
    })
  }

  patchData(){
    this.creditForm.patchValue({
      smsCredits: this.data.smsRemaining ? this.data.smsRemaining : ''
    })
  }
  
  onYesClick(data:any) {
    if(this.creditForm.value.smsCredits === '' || this.creditForm.value.smsCredits === '0' || this.creditForm.value.smsCredits === null || this.creditForm.value.smsCredits === undefined){
      this.alertService.error("Number of sms is required");
      return;
    }
    const params:any = {}
    params['data']={
      communityId: data.communityId,
      smsCredits: parseInt(this.creditForm.value.smsCredits)
    }
    this.loader.show();
    if(data.smsRemaining){
      this.apollo.setModule('updateCommunitySmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
        if(response.error) {
            this.alertService.error(response.message);
        } 
        else {
          this.SmsEmailRemainingService.emitData(response.data?.smsCreditsRemaining,"sms","editSms");
          this.alertService.success(response.message);
          this.dialogRef.close(true);
        }
      })
    }
    else{
      this.apollo.setModule('addCommunitySmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
        if(response.error) {
            this.alertService.error(response.message);
        } 
        else {
          this.SmsEmailRemainingService.emitData(response.data?.smsCreditsRemaining,"sms","addSms");
          this.alertService.success(response.message);
          this.dialogRef.close(true);
        }
      })
    }
    this.loader.hide(); 
  }


  onNoBtnClick(): void {
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**Using for validation(number checking)*/
  isNumber(evt:any) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
  }

  getRemainingCreditBalance(){
    this.loader.show();
    this.apollo.setModule('getAdminSmsEmailCredit').queryData().subscribe((response: GeneralResponse) => {
      if(response.error) {
          this.alertService.error(response.message);
      } 
      else {
        this.saveRemainingSMSBalance  = response.data.smsCreditsRemaining;
      }
    })
    this.loader.hide(); 
  }

}
