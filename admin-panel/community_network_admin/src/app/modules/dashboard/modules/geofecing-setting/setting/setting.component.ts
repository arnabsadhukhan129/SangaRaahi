import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
  rangeForm!: UntypedFormGroup;

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    // this.generateForm();
  }

  back(){
    this.router.navigateByUrl('/dashboard');
  }

  generateForm(){
    this.rangeForm = new UntypedFormGroup({
      distance : new UntypedFormControl(''),       
  });
  }

  saveData(distance: any){
    if(distance.value === "" || distance.value === null || distance.value === undefined){
      this.alertService.error("Please enter radius!");
      return;
    }
    const params: any = {};
    params['data'] = {
      distance: parseInt(distance.value)
    }
    this.loaderService.show();
    this.apolloClient.setModule("addOrUpdateDistance").mutateData(params).subscribe((response: any) => {
      if (response.error) {
        this.loaderService.hide();
        this.alertService.error(response.message);
        this.router.navigateByUrl('/dashboard/geofecingSetting');
      }
      else {
        this.loaderService.hide();
        this.alertService.error(response.message);
        this.router.navigateByUrl('/dashboard');
      }
    });
  }
}
