import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Group ,Community, GroupMember, GroupMemberByID} from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-group-view',
  templateUrl: './group-view.component.html',
  styleUrls: ['./group-view.component.scss']
})
export class GroupViewComponent implements OnInit {
  group!: Group;
  community: Community;
  members: Array<GroupMember>;
  member: Array<GroupMemberByID>;
  groupId: String;
  communityId: String;
  displayedColumns : String[];
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getGroupById();
    this.getMembersById();
  }

  getGroupById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAdminGroupByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getAdminGroupByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.group = response.data;
        console.log(response.data)
        this.groupId = response.data.id;
        this.communityId = response.data.communityId;
        this.members = response.data.members;
        this.getCommunitiesById(this.communityId)
      }
    });
  }
  getCommunitiesById(id:String) {
    const param = {
      getCommunityByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getCommunityByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.community = response.data;
      }
    });
  }

  getMembersById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getMembersByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getMembersById').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.member = response.data;

        this.displayedColumns = ['no','MemberName', 'MemberEmail', 'Roles'];
      }
    });
  }


}
