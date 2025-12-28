import { Component, Inject, OnInit } from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import { DialogAddSMS, DialogDataModel } from '../../models/dialog-data.model';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';
import { ApolloClientService } from '../../services/apollo-client.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { GeneralResponse } from '../../interfaces/general-response.ineterface';
import { SmsEmailRemainingService } from '../../services/sms-email-remaining.service';

@Component({
  selector: 'app-admin-sms',
  templateUrl: './admin-sms.component.html',
  styleUrls: ['./admin-sms.component.scss']
})
export class AdminSmsComponent implements OnInit {
  smscreditForm!: UntypedFormGroup;
  constructor(
    public dialogRef: MatDialogRef<AdminSmsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDataModel,
    private formBuilder : UntypedFormBuilder,
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private SmsEmailRemainingService: SmsEmailRemainingService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(){
    this.smscreditForm  = this.formBuilder.group({
      smsCredits: ['']
    })
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

  onYesClick() {
    if(this.smscreditForm.value.smsCredits === '' || this.smscreditForm.value.smsCredits === '0' || this.smscreditForm.value.smsCredits === null || this.smscreditForm.value.smsCredits === undefined){
      this.alertService.error("Number of sms is required");
      return;
    }
    const params:any = {};
    params['data']={
      smsCredits: parseInt(this.smscreditForm.value.smsCredits)
    }
    this.loader.show();
    this.apollo.setModule('addAdminSmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
      if(response.error) {
          this.alertService.error(response.message);
      } 
      else {
        // this.SmsEmailRemainingService.emitAdminData(parseInt(this.smscreditForm.value.smsCredits));
        this.SmsEmailRemainingService.emitAdminData(response.data?.smsCreditsRemaining);
        this.alertService.success(response.message);
        this.dialogRef.close(true);
      }
    })
    this.loader.hide();
    this.dialogRef.close(true);
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }

}
