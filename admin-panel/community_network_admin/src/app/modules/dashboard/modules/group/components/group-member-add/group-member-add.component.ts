import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { User } from 'src/app/shared/typedefs/custom.types';
import { Router, ActivatedRoute } from '@angular/router';
import { MatLegacyOption as MatOption } from '@angular/material/legacy-core';

type NewType = MatOption;

@Component({
  selector: 'app-group-member-add',
  templateUrl: './group-member-add.component.html',
  styleUrls: ['./group-member-add.component.scss']
})
export class GroupMemberAddComponent implements OnInit {
  // allSelected: boolean = false;
  addGroupMember: UntypedFormGroup;
  users: Array<User>;
  noUser: boolean;
  userCount: Number;

  @ViewChild('allSelected') private allSelected: NewType;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { 
    this.addGroupMember = new UntypedFormGroup({
      user: new UntypedFormControl([], [Validators.required])
    });
  }

  ngOnInit(): void {
    this.getAvailableUser();
  }

  getAvailableUser() {
    const id = this.route.snapshot.paramMap.get('id');
    
    const params:any = {
      getAvailableCommunityUserId: id
      }
      
    
    this.loaderService.show();
    this.apolloClient.setModule('getAvailableCommunityUser').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        if(response.data.length === 0) {
          this.addGroupMember.controls['user'].disable();
          this.noUser = true;
        }
        this.userCount = response.data.length;
        this.users = response.data;
      }
    });
  }

  submit(){
    const user = this.addGroupMember.controls['user'].value;
    const id = this.route.snapshot.paramMap.get('id');
    
    const data = {
      data: {
        id: id,
        memberId: user
      }
    }
    if(this.allSelected.selected){
      user.splice(-1);
    }
    this.loaderService.show();
    this.apolloClient.setModule("addGroupMember").mutateData(data)
    .subscribe((response:GeneralResponse) => {
      if(response.error) {
        // Sow toaster
        this.alertService.error(response.message);
      } else {
        this.alertService.success(response.message);
        // Redirect to the group view list.
        this.router.navigateByUrl('dashboard/group/view/'+id);
      }
      this.loaderService.hide();
    });
  }

  toggleAllSelection() {
    if(this.allSelected.selected){
      this.addGroupMember.controls['user']
      .patchValue([...this.users.map(item => item.id), 0]);
      this.allSelected.select();
    }else{
      this.addGroupMember.controls['user'].patchValue([]);
      this.allSelected.deselect();
    }
  }

  memberLength() {
    const changeCount = this.addGroupMember.controls['user'].value.length;
    if(this.allSelected.selected) {
      this.allSelected.deselect();
    }else if(this.userCount === changeCount) {
      this.allSelected.select();
    }
  }

  
}
