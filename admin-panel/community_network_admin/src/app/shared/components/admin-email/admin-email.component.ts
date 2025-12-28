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
  selector: 'app-admin-email',
  templateUrl: './admin-email.component.html',
  styleUrls: ['./admin-email.component.scss']
})
export class AdminEmailComponent implements OnInit {
  emailcreditForm!: UntypedFormGroup
  constructor(
    public dialogRef: MatDialogRef<AdminEmailComponent>,
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
    this.emailcreditForm  = this.formBuilder.group({
      emailCredits: ['']
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

  onNoBtnClick(): void {
    this.dialogRef.close();
  }

  onYesClick() {
    if(this.emailcreditForm.value.emailCredits === '' || this.emailcreditForm.value.emailCredits === '0' || this.emailcreditForm.value.emailCredits === null || this.emailcreditForm.value.emailCredits === undefined){
      this.alertService.error("Number of email is required");
      return;
    }
    const params:any = {};
    params['data']={
      emailCredits: parseInt(this.emailcreditForm.value.emailCredits)
    }
    this.loader.show();
    this.apollo.setModule('addAdminSmsEmailCredit').mutateData(params).subscribe((response: GeneralResponse) => {
      if(response.error) {
          this.alertService.error(response.message);
      } 
      else {
        // this.SmsEmailRemainingService.emitAdminEmailData(parseInt(this.emailcreditForm.value.emailCredits));
        this.SmsEmailRemainingService.emitAdminEmailData(response.data?.emailCreditsRemaining);
        this.alertService.success(response.message);
        this.dialogRef.close();
      }
    })
    this.loader.hide();
    this.dialogRef.close();
  }

}
