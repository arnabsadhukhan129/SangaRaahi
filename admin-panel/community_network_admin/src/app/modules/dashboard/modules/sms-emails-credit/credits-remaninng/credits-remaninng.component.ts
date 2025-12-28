import { Component, OnInit, ViewChild } from '@angular/core';
import { DialogAddSMS, DialogDataModel } from 'src/app/shared/models/dialog-data.model';
import { DialogAction, DialogActionAdd } from 'src/app/shared/enums/common.enums';
import { DialogService } from 'src/app/shared/services/dialog.service';
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { SmsEmails } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import { SmsEmailRemainingService } from 'src/app/shared/services/sms-email-remaining.service';
@Component({
  selector: 'app-credits-remaninng',
  templateUrl: './credits-remaninng.component.html',
  styleUrls: ['./credits-remaninng.component.scss']
})
export class CreditsRemaninngComponent implements OnInit {
  smsEmailsData: Array<SmsEmails>;
  matTableDataSource: MatTableDataSource<SmsEmails>;
  displayedColumns: string[];
  current: number = 1;
  total: number;
  column:String;
  sorting:String;
  loggedUser:String;
  search:String;
  index: number = 0;
  saveRemainingSMSBalance: any;
  saveRemainingEmailBalance: any;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService: DialogService,
    private SmsEmailRemainingService: SmsEmailRemainingService
  ) { }

  ngOnInit(): void {
    this.getAllCommunitiesSmsEmailCredit(this.current);
    this.getRemainingCreditBalance();
  }

  @ViewChild(MatSort) sort: MatSort;
  
  eventSortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getAllCommunitiesSmsEmailCredit(this.current,this.search,sortState.active,sortState.direction);
  }

  getAllCommunitiesSmsEmailCredit(page:Number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {data:{}};
    this.search = search;
    params.data = {
      search:search ? search : '',
      page : page,
      columnName : columnName,
      sort : sort
    }
    this.loader.show();
    this.apollo.setModule('getAllCommunitiesSmsEmailCredit').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.smsEmailsData = response.data?.communitiesSmsEmailCredit;
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }
        this.matTableDataSource = new MatTableDataSource<SmsEmails>(this.smsEmailsData);
        //this.displayedColumns = ['no','CommunityName', 'communityType', 'createBy', 'smsRemaining', 'emailsRemaining', 'status', 'actionItems'];
        this.displayedColumns = ['no','CommunityName', 'communityType', 'createBy', 'smsRemaining', 'emailsRemaining', 'status', 'Actions'];


        this.SmsEmailRemainingService.getData().subscribe((element)=>{ 
          if(element.type === "email"){
            if(element.action === "editEmail"){
              this.smsEmailsData[this.index].emailCreditsRemaining = element.val;
            }
            else if(element.action === "addEmail"){
              this.smsEmailsData[this.index].emailCreditsRemaining = element.val;
            }
          }
          else if(element.type === "sms"){
            if(element.action === "editSms"){
              this.smsEmailsData[this.index].smsCreditsRemaining = element.val;
            }
            else if(element.action === "addSms"){
              this.smsEmailsData[this.index].smsCreditsRemaining = element.val;
            }
          }
          this.getRemainingCreditBalance();
        })
        this.SmsEmailRemainingService.getAdminData().subscribe((val)=>{
          // this.saveRemainingSMSBalance = val + this.saveRemainingSMSBalance;
          this.saveRemainingSMSBalance = val;
        })
        this.SmsEmailRemainingService.getAdminEmailData().subscribe((value)=>{
          // this.saveRemainingEmailBalance = value + this.saveRemainingEmailBalance;
          this.saveRemainingEmailBalance = value;
        })
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getAllCommunitiesSmsEmailCredit(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getAllCommunitiesSmsEmailCredit(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getAllCommunitiesSmsEmailCredit(this.current,this.search,this.column,this.sorting);
  }

  markActiveInactive(id:string, index:number, action:string) {
    const data: DialogDataModel = {
      contentName:"Event",
      actionName:action
    }
    this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
      if(result) {
        const params = {
          eventStatusChangeId: id
        }
        this.loader.show();
        this.apollo.setModule('eventStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
          this.loader.hide();
          if (response.error) {
            this.alertService.error(response.message);
          } else {
            // this.alertService.success(response.message);
            this.alertService.success("Event status chnaged successfully.");
            // Now change the element active status
            this.smsEmailsData[index].isActive = !this.smsEmailsData[index].isActive;
          }
        });
      }
    });
  }

  deleteEvent(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"Event",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteEvent').mutateData({"deleteEventId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.smsEmailsData.splice(index, 1);
            this.matTableDataSource.data = this.smsEmailsData;
          }
          this.loader.hide();
        });
      }
      
    });
  }

  viewEvent(id:string){
    this.router.navigateByUrl('dashboard/event/view/'+id);
  }

  edit(communityId:string,sms:any,email:any,communityDescription: string,index:number){
    const data: DialogAddSMS = {
      dialogTitle: "Edit SMS Credit",
      contentName: "SMS",
      actionName: "Edit Sms",
      communityId: communityId, 
      smsRemaining: sms,
      emailRemaining: email,
      communityDescription: communityDescription
    }
    this.dialogService.openAddInputDialog(DialogActionAdd.Edit, data);
    this.index = index;
  }

  smsAdd(communityId:string,sms: string,communityDescription: string,index:number){
    const data: DialogAddSMS = {
      dialogTitle: "Add amount of sms credit",
      contentName: "SMS",
      actionName: "Add Sms",
      communityId: communityId,
      sms: sms,
      communityDescription: communityDescription
    };  
    this.dialogService.openAddInputDialog(DialogActionAdd.AddSMS, data);
    this.index = index;
  }

  emailAdd(communityId:string, email:any,communityDescription: string,index:number){
    const data: DialogAddSMS = {
      dialogTitle: "Add amount of email credit",
      contentName: "Email",
      actionName: "Add Email",
      communityId: communityId,
      email: email,
      communityDescription: communityDescription
    };  
    this.dialogService.openAddInputDialog(DialogActionAdd.AddEmail, data);
    this.index = index;
  }

  smsAddAdmin(){
    const data: DialogAddSMS = {
      dialogTitle: "Add amount of sms credit",
      contentName: "SMS",
      actionName: "Add Sms",
    }
    this.dialogService.openAddInputDialog(DialogActionAdd.AddAdminSms, data);
  }

  /**Using for admin email remaining */
  emailAddAdmin(){
    const data: DialogAddSMS = {
      dialogTitle: "Add amount of email credit",
      contentName: "Email",
      actionName: "Add Email",
    }
    this.dialogService.openAddInputDialog(DialogActionAdd.AddAdminEmail, data);
  }

  getRemainingCreditBalance(){
    this.loader.show();
    this.apollo.setModule('getAdminSmsEmailCredit').queryData().subscribe((response: GeneralResponse) => {
      if(response.error) {
          this.alertService.error(response.message);
      } 
      else {
        this.saveRemainingEmailBalance  = response.data.emailCreditsRemaining;
        this.saveRemainingSMSBalance  = response.data.smsCreditsRemaining;
      }
    })
    this.loader.hide(); 
  }

}
