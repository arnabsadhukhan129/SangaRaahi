import {Component, OnInit} from '@angular/core';
import {GeneralResponse} from 'src/app/shared/interfaces/general-response.ineterface';
import {AlertService} from 'src/app/shared/services/alert.service';
import {ApolloClientService} from 'src/app/shared/services/apollo-client.service';
import {LoaderService} from 'src/app/shared/services/loader.service';
import {Community} from 'src/app/shared/typedefs/custom.types';
import {Router} from '@angular/router';
import {DialogDataModel, AlertDialogDataModel, DisplayPdfModel} from "../../../../../../shared/models/dialog-data.model";
import {DialogService} from "../../../../../../shared/services/dialog.service";
import {DialogAction, AlertDialogAction, DisplayPdfAction} from "../../../../../../shared/enums/common.enums";
import {MatLegacyTableDataSource as MatTableDataSource} from "@angular/material/legacy-table";
import { MatSort, Sort } from '@angular/material/sort';
import {environment} from "../../../../../../../environments/environment";
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-community-list',
  templateUrl: './community-list.component.html',
  styleUrls: ['./community-list.component.css']
})

export class CommunityListComponent implements OnInit {
  public communities: Array<Community>;
  public matTableDataSource: MatTableDataSource<Community>;
  displayedColumns: string[];
  current: number = 1;
  total: number;
  search:String;
  column:String;
  sorting:String;
  web_page_url: String = environment.WEB_PAGE_URL;
  enableFilter: boolean = false;
  filterForm!: UntypedFormGroup;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private dialogService:DialogService
  ) { }

  communitySortChange(sortState: Sort) {
    this.column = sortState.active;
    this.sorting = sortState.direction;
    this.getCommunities(this.current,this.search,sortState.active,sortState.direction);
  }


  ngOnInit(): void {
    this.generateForm();
    this.getCommunities(this.current,'');   
  }

  generateForm() {
    this.filterForm = new UntypedFormGroup({
      bankcheckStatus: new UntypedFormControl(''),
      communityType: new UntypedFormControl(''),
      isActive: new UntypedFormControl(''),
      webpageApprovalStatus: new UntypedFormControl(''),
    });   
  }

  getCommunities(page:number,search:String = '',columnName:String = '',sort:String = '') {
    const params:any = {};
    this.search = search;
    if(search || page) {
      params['data'] = {
        search:search ? search : '',
        page:page ? page : '',
        columnName:columnName,
        sort:sort
      }
    }    
    if(this.filterForm.value.bankcheckStatus && this.filterForm.value.bankcheckStatus!=''){
        params['data'].bankcheckStatus = this.filterForm.value.bankcheckStatus;      
     }
    if(this.filterForm.value.communityType && this.filterForm.value.communityType!=''){
      params['data'].communityType = this.filterForm.value.communityType;      
    } 
    if(this.filterForm.value.isActive && this.filterForm.value.isActive!=''){

      if(this.filterForm.value.isActive === "Active"){
        params['data'].isActive = true;
      }
      else{
        params['data'].isActive = false;
      }    
    }
    if(this.filterForm.value.webpageApprovalStatus && this.filterForm.value.webpageApprovalStatus!=''){
      params['data'].webpageApprovalStatus = this.filterForm.value.webpageApprovalStatus;      
    }

    this.loader.show();
    this.apollo.setModule('getAllCommunities').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {      
        // this.alertService.success(response.message);
        this.communities = response.data.communities;
        if(response.data.total !== 0) {
          this.total = Math.ceil(response.data.total / 10);
        }else {
          this.total = 0;
        }     
        
        this.matTableDataSource = new MatTableDataSource<Community>(this.communities);
        this.displayedColumns = ['no','CommunityType', 'CommunityName','WebPageLink','WebpageApproval','ViewPaymentBankDetails','BankDetailsApproval', /*'CommunityDescription','CommunityLocation', 'Owner',*/ 'Featured','PublicityPageStatus','FreezePaneSettings','paymentSettings','Status','Actions'];
      }
    });
  }

  onGoTo(page: number): void {
    this.current = page
    this.getCommunities(this.current,this.search,this.column,this.sorting);
  }
  
  public onNext(page: number): void {
    this.current = page + 1
    this.getCommunities(this.current,this.search,this.column,this.sorting);
  }
  
  public onPrevious(page: number): void {
    this.current = page - 1
    this.getCommunities(this.current,this.search,this.column,this.sorting);
  }

  deleteCommunity(id:string, index:number){
    const data: DialogDataModel = {
      contentName:"Community",
      actionName:"permanently delete"
    };
    this.dialogService.openDialog(DialogAction.DELETE, data).subscribe(result => {
      if(result) {
        this.loader.show();
        this.apollo.setModule('deleteCommunity').mutateData({"deleteCommunityId": id}).subscribe((response: GeneralResponse) => {
          if(response.error) {
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Remove the row from the array
            this.communities.splice(index, 1);
            this.matTableDataSource.data = this.communities;
          }
          this.loader.hide();
        });
      }
      
    });
  }

  editCommunity(id:string){
    this.router.navigateByUrl('dashboard/community/edit/'+id);
  }

  viewCommunity(id:string){
    this.router.navigateByUrl('dashboard/community/view/'+id);
  }

  communityMember(id:string){
    this.router.navigateByUrl('dashboard/community/member/'+id);
  }

  markActiveInactive(id:string, index:number, action:string) {
      const data: DialogDataModel = {
        contentName:"Community",
        actionName:action
      }
      this.dialogService.openDialog(DialogAction.STATUS, data).subscribe(result => {
        if(result) {
          const params = {
            communityStatusChangeId: id
          }
          this.loader.show();
          this.apollo.setModule('communityStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
            this.loader.hide();
            if (response.error) {
              this.alertService.error(response.message);
            } else {
              // this.alertService.success(response.message);
              this.alertService.success("Community status changed successfully.");
              // Now change the element active status
              this.communities[index].isActive = !this.communities[index].isActive;
            }
          });
        }
      });
    }

    featuredToggle(e:any, id:string, index:number) {  

        if(!this.communities[index].communitySettings.publicityPage && !this.communities[index].isFeatured)
        {

          this.communities[index].isFeatured = !this.communities[index].isFeatured;
          

              const data: AlertDialogDataModel = {
                dialogMessage:"First enable Publicity Page Settings to enable Featured.",
              };
              this.dialogService.openAlertDialog(AlertDialogAction.ALERT, data).subscribe(result => {
                if(result) 
                {
                  this.communities[index].isFeatured = false;
                }
                
              });
        }
        else
        {
              const params = {
                "data": {
                  "id": id
                }
              }
              this.loader.show();
              this.apollo.setModule('updateCommunityFeaturedStatus').mutateData(params).subscribe((response: GeneralResponse) => {
                this.loader.hide();
                if (response.error) {
                  this.alertService.error(response.message);
                } else {
                  this.communities[index].isFeatured = !this.communities[index].isFeatured;
                }
              });
        }
        
    }

    freezePaneToggle(e:any, id:string, index:number) {   

      if(this.communities[index].communitySettings.webpageApprovalStatus!= 'active' && this.communities[index].communitySettings.slug!=null  && this.communities[index].communitySettings.slug!='') 
      {
          
          const data: AlertDialogDataModel = {
            dialogMessage:"You can't change freeze pane status. Admin approval is pending for some field. Please, acknowledge them first.",
          };
          this.dialogService.openAlertDialog(AlertDialogAction.ALERT, data).subscribe(result => {
            if(result) {
              this.getCommunities(this.current,'');  
             // this.communities[index].communitySettings.freezePane = e.checked ? false : true;     
            }
            
          });
      }
      else
      {
          let freezePaneValue = this.communities[index].communitySettings.freezePane;

          const params = {
            "data": {
              "id": id
            }
          }
          this.loader.show();
          this.apollo.setModule('updatefreezePaneStatus').mutateData(params).subscribe((response: GeneralResponse) => {
            
            if (response.error) {
              this.alertService.error(response.message);
            } else {
              this.communities[index].communitySettings.freezePane = !freezePaneValue;
              this.alertService.error(response.message);
            }
    
            this.loader.hide();
          });
      }

      
    }

    paymentSettingToggle(e:any, id:string, index:number) {   
          const params = {
            "data": {
              "id": id
            }
          }
          this.loader.show();
          this.apollo.setModule('updateEventPaymentStatus').mutateData(params).subscribe((response: GeneralResponse) => {
            
            if (response.error) {
              this.alertService.error(response.message);
            } else {
              // this.communities[index].communitySettings.freezePane = !freezePaneValue;
              this.alertService.error(response.message);
            }
    
            this.loader.hide();
          });
    }

    publicityToggle(e:any, id:string, index:number) {   
      const params = {
        "data": {
          "id": id
        }
      }
      this.loader.show();
      this.apollo.setModule('publicityPageStatusChange').mutateData(params).subscribe((response: GeneralResponse) => {
        this.loader.hide();
        if (response.error) {
          this.alertService.error(response.message);
        } else {
          this.communities[index].communitySettings.publicityPage = !this.communities[index].communitySettings.publicityPage;

              if(!this.communities[index].communitySettings.publicityPage)
              {
                  this.communities[index].isFeatured = false; 
              }
        }
      });
    }

    openPaymentBankDetails(communityId:string, bankcheckImage:any, bankcheckStatus:any)
    {
        if(bankcheckImage!=null && bankcheckImage!='')
        {
              const data: DisplayPdfModel = {
                dialogTitle: "View bank related document as preview",
                communityId: communityId,
                pdfLink: bankcheckImage,
                bankcheckStatus: bankcheckStatus
              };
              this.dialogService.openPdfModal(DisplayPdfAction.VIEW, data).subscribe(result => {
                if(result) {
                  this.getCommunities(this.current,'');  
                }
                
              });
        }
        else
        {
              const data: AlertDialogDataModel = {
                dialogMessage:"Data Not Available.",
              };
              this.dialogService.openAlertDialog(AlertDialogAction.ALERT, data).subscribe(result => {
                if(result) {
                }
                
              });
        }


         
    }

    toggleFilter()
    {
          this.enableFilter = !this.enableFilter;
    }

    clearDateFilter() {
      this.filterForm.controls['bankcheckStatus'].setValue('');
      this.filterForm.controls['communityType'].setValue('');
      this.filterForm.controls['isActive'].setValue('');
      this.filterForm.controls['webpageApprovalStatus'].setValue('');
      this.current = 1;
      this.getCommunities(this.current,'');
    }

    

    // openApproval(id:string)
    // {
    //     this.router.navigateByUrl('dashboard/community/webpageApproval/'+id);
    // }

}
