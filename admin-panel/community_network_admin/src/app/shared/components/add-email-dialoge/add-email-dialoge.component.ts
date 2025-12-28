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
  selector: 'app-add-email-dialoge',
  templateUrl: './add-email-dialoge.component.html',
  styleUrls: ['./add-email-dialoge.component.scss']
})
export class AddEmailDialogeComponent implements OnInit {
  creditForm!:UntypedFormGroup;
  saveRemainingSMSBalance: any;
  safeDescription!: SafeHtml;

  constructor(
    public dialogRef: MatDialogRef<AddEmailDialogeComponent>,
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
    //this.getRemainingCreditBalance();
    // if(this.data.emailRemaining){
    //   this.patchData();
    // }
    // ✅ Sanitize HTML description
    if (this.data.communityDescription) {
      this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(this.data.communityDescription);
    }
  }

  initForm(){
    this.creditForm  = this.formBuilder.group({
      emailCredits: ['']
    })
  }

  patchData(){
    this.creditForm.patchValue({
      emailCredits: this.data.emailRemaining ? this.data.emailRemaining : ''
    })
  }
  
  onYesClick(data:any) {
    if(this.creditForm.value.emailCredits === '' || this.creditForm.value.emailCredits === '0' || this.creditForm.value.emailCredits === null || this.creditForm.value.emailCredits === undefined){
      this.alertService.error("Number of email is required");
      return;
    }
    const params:any = {}
    params['data']={
      communityId: data.communityId,
      emailCredits: parseInt(this.creditForm.value.emailCredits)
    }
    this.loader.show();
    if(data.emailRemaining){
      this.apollo.setModule('updateCommunitySmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
        if(response.error) {
            this.alertService.error(response.message);
        } 
        else {
          this.SmsEmailRemainingService.emitData(response.data?.emailCreditsRemaining,"email","editEmail")
          this.alertService.success(response.message);
          this.dialogRef.close({data:response});
        }
      })
    }
    else{
      this.apollo.setModule('addCommunitySmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
        if(response.error) {
            this.alertService.error(response.message);
        } 
        else {
          this.SmsEmailRemainingService.emitData(response.data?.emailCreditsRemaining,"email","addEmail")
          this.alertService.success(response.message);
          this.dialogRef.close(true);
        }
      })
    }
    //this.CreditsRemaninngComponent.getAllCommunitiesSmsEmailCredit(data.current);
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
        this.saveRemainingSMSBalance  = response.data.emailCreditsRemaining;
      }
    })
    this.loader.hide(); 
  }

}
