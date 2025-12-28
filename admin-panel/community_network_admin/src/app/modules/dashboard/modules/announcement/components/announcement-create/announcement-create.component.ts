import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { Router, ActivatedRoute } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
import {map, Observable} from 'rxjs';
import { Community } from 'src/app/shared/typedefs/custom.types';

@Component({
  selector: 'app-announcement-create',
  templateUrl: './announcement-create.component.html',
  styleUrls: ['./announcement-create.component.scss']
})
export class AnnouncementCreateComponent implements OnInit {
  myControl = new UntypedFormControl('');
  createAnnouncement: UntypedFormGroup;
  isEdit: String = "Add Announcement";
  minDate: Date;
  communities: Array<Community>;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { 
    this.createAnnouncement = new UntypedFormGroup({
      communityId: new UntypedFormControl(null, [Validators.required]),
      type: new UntypedFormControl(null, [Validators.required]),
      title: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      description: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      endDate:new UntypedFormControl(null,[Validators.required])      
    });
  }

  ngOnInit(): void {
    if(this.route.snapshot.paramMap.get('id') !== null){
      this.createAnnouncement.controls['communityId'].disable();
      this.createAnnouncement.controls['type'].disable();
      this.isEdit = "Edit Event";
      this.getAnnouncementById();    
    }
    this.minDate = new Date();
    this.getCommunities();
  }
  
  change() {
    const userType = this.createAnnouncement.controls['endDate'].value;
    console.log(userType)
  }
  

  submit() {
    const communityId = this.createAnnouncement.controls['communityId'].value;
    const type = this.createAnnouncement.controls['type'].value;
    const title = this.createAnnouncement.controls['title'].value;
    const description = this.createAnnouncement.controls['description'].value;
    const toDate = this.createAnnouncement.controls['endDate'].value;
    const endDate = `${toDate.getFullYear()}-${toDate.getMonth()+1}-${toDate.getDate()}`;
      if(this.route.snapshot.paramMap.get('id') !== null) {
        const id = this.route.snapshot.paramMap.get('id');
        const data = {
          updateAnnouncementId: id,
          data: {
            title: title,
            description: description,
            endDate: endDate
          }
        }
        
        this.loaderService.show();
        this.apolloClient.setModule("updateAnnouncement").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          this.loaderService.hide();
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success("Announcement updated successfully.");
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/announcement');
          }
        });
      }else{
        const data = {
          data: {
            communityId: communityId,
            title: title,
            description: description,
            endDate: endDate,
            type: type
          }
        }
  
        this.loaderService.show();
        this.apolloClient.setModule("createAnnouncement").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success("Announcement added successfully.");
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/announcement');
          }
          this.loaderService.hide();
        });
      }
    }
    
    
    
  
  
  getAnnouncementById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAnnouncementByIdId: id
    }
    this.loaderService.show();
    this.apolloClient.setModule('getAnnouncementByID').queryData(param).subscribe((response: GeneralResponse) => {
      
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        const data = response.data;
        let endDate:any = '';
        if(data.endDate){
          endDate = new Date(data.endDate);
          endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        }

        this.createAnnouncement.patchValue({
          communityId: data.communityId,
          type:  data.toWhom,
          title: data.title,
          description: data.description,
          endDate:endDate,
          
        });
      }
    });
  }

  getCommunities() {
    const params:any = {};
      params['data'] = {
        "isActive": true,
        "isDeleted": false
      }


    this.loaderService.show();
    this.apolloClient.setModule('getMyCommunities').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.communities = response.data.myCommunities;
      }
    });
  }

  noWhitespaceValidator(control: UntypedFormControl) {
    if (control.value && control.value.startsWith(' ')) {
      return {
        'whitespace': true
      };
    }
    if (control.value && control.value.endsWith(' ')) {
      return {
        'whitespace': true
      };
    }
  
    return null;
  }
}
