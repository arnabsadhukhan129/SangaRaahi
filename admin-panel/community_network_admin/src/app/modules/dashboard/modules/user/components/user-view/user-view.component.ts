import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserMain } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import {DialogDataModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {DialogAction} from "../../../../../../shared/enums/common.enums";

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  user: UserMain;
  userId: String;
  dateOfBirth:any;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService:DialogService
  ) { }

  ngOnInit(): void {
    this.getUserById()
  }

  getUserById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getUserByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getUserByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.user = response.data;
        this.userId = response.data.id;
        this.dateOfBirth = response.data.dateOfBirth && response.data.dateOfBirth.value ? new Date(Date.parse(response.data.dateOfBirth.value)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"}) : "N/A";
      }
    });
  }

  resetPassword(id:string){
    const data: DialogDataModel = {
      dialogTitle: "Password Reset",
      contentName:"User",
      actionName:"Reset the Password of"
    };
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('resetUserPassword').mutateData({"resetUserPasswordId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
          }
          this.loader.hide();
        });
      }
      
    });
  }
}

