import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-community-view',
  templateUrl: './community-view.component.html',
  styleUrls: ['./community-view.component.scss']
})
export class CommunityViewComponent implements OnInit {
  community: Community;
  communityId: String;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getCommunitiesById()
  }

  getCommunitiesById() {
    const id = this.route.snapshot.paramMap.get('id');
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
        this.communityId = response.data.id;
      }
    });
  }
}
