import { Component, OnDestroy, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import {environment} from "../../../../../../../environments/environment";
import { CommonService } from 'src/app/modules/dashboard/services/common.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-community-webpage-approval',
  templateUrl: './community-webpage-approval.component.html',
  styleUrls: ['./community-webpage-approval.component.scss']
})
export class CommunityWebpageApprovalComponent implements OnInit, OnDestroy {
  redirectSubscription!: Subscription;
  communityId: any;
  selectedTab : number = 0;
  selectedTabName : String = 'Home';
  slug: any;
  web_page_url: String = environment.WEB_PAGE_URL;
  showHomeApproval : boolean = false;
  showVideosApproval : boolean = false;
  showPaymentDetailsApproval : boolean = false;
  showAboutUsApproval : boolean = false;
  
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private commonService: CommonService
  ) { 
  }

  ngOnInit(): void 
  {
      this.redirectSubscription = this.commonService.getValue().subscribe((element)=>{
            console.log("element=====",element);
            if(element){
                  this.switchTab(element)
            }
            
      })
      this.activatedRoute.paramMap.subscribe((params)=>{
          this.communityId = params.get('id');
          this.slug = params.get('slug');
      });
  }

  ngOnDestroy(){
      if(this.redirectSubscription){
            this.redirectSubscription.unsubscribe();
      }
  }

  switchTab(value:number)
  {
      this.selectedTab = value;

      if(this.selectedTab == 0)
      {
            this.selectedTabName = 'Home';
      }
      else if(this.selectedTab == 1)
      {
            this.selectedTabName = 'Videos';
      }
      else if(this.selectedTab == 2)
      {
            this.selectedTabName = 'PaymentDetails';
      }
      else if(this.selectedTab == 3)
      {
            this.selectedTabName = 'AboutUs';
      }
     //console.log(this.selectedTab);
  }


  showNeedApproval(type:string)
  {
      if(type === "Home")
      {
            this.showHomeApproval = true;
      }
      else if(type === "Videos")
      {
            this.showVideosApproval = true;
      }
      else if(type === "PaymentDetails")
      {
            this.showPaymentDetailsApproval = true;
      }
      else if(type === "AboutUs")
      {
            this.showAboutUsApproval = true;
      }

  }
 



}

