import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-community-setting',
  templateUrl: './community-setting.component.html',
  styleUrls: ['./community-setting.component.scss']
})
export class CommunitySettingComponent implements OnInit {

  community: Community;
  communityId: String;
  selectedTab : number = 0;

  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
  }


  switchTab(value:number)
  {
      this.selectedTab = value;
  }

}
