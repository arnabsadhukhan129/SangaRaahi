import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import {MatLegacyDialog as MatDialog, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import { CommunityModalComponent } from 'src/app/shared/components/community-modal/community-modal.component';
import {DialogService} from "../../../../../../../../shared/services/dialog.service";
import {DialogDataModel} from "../../../../../../../../shared/models/dialog-data.model";
import {DialogAction, AlertDialogAction, DisplayPdfAction} from "../../../../../../../../shared/enums/common.enums";
//import { EventEmitter } from 'stream';

@Component({
  selector: 'app-about-us-approval',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class CommunityApprovalAboutUsComponent implements OnInit {

  approvalList: Array<any> = [];
  @Input() communityId: String;
  @Output() dataEvent = new EventEmitter();
  @Output() needApproval = new EventEmitter();
  
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private dialogService:DialogService
  ) { }

  ngOnInit(): void {
    this.getApprovalList();
  }

  getApprovalList(): void
  {
        const params:any={};
        params['data']={
          communityId: this.communityId,
          type: "About"
        }


        this.loaderService.show();
        this.apolloClient.setModule("adminLogApprovalList").mutateData(params).subscribe((response:any) => {
          if(response.error){
            this.alertService.error(response.message);
          }
          else{
                this.approvalList = response.data;

                if(this.approvalList.length > 0)
                {
                      this.needApproval.emit("AboutUs");
                }
            
          }
          this.loaderService.hide();
        })
  }

  updateApprovalStatus(value:any, id:string, index:number, fieldname:string): void
  {
    const data: DialogDataModel = {
      dialogTitle:"Approve "+fieldname,
      contentName:fieldname,
      actionName:"approve"
    };

    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {

      if(result) {

        const params:any={};
        params['data']={
          id: id,
          isApprove: !value
        }

        this.loaderService.show();
        this.apolloClient.setModule("adminLogApproval").mutateData(params).subscribe((response:any) => {    
          if(response.error){
            this.alertService.error(response.message);
          }
          else{
            this.getApprovalList();
            this.alertService.success(response.message);            
          }
          this.loaderService.hide();
        })

      }
      else
      {
            this.getApprovalList();
      }
      
    });

  }

  goNext()
  {
        this.dataEvent.emit(0);
  }

  openDialog(index:number): void {
    const dialogRef = this.dialog.open(CommunityModalComponent, {
      height: '400px',
      width: '600px',
      data: {type:"About", content: this.approvalList[index]},
    });

    dialogRef.afterClosed().subscribe(result => {
      //console.log('The dialog was closed');
      this.getApprovalList();
    });
  }

}
