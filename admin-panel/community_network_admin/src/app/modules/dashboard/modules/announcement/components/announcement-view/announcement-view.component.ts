import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Announcement } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-announcement-view',
  templateUrl: './announcement-view.component.html',
  styleUrls: ['./announcement-view.component.scss']
})
export class AnnouncementViewComponent implements OnInit {
  announcement!: Announcement;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getAnnouncementById();
  }

  getAnnouncementById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAnnouncementByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getAnnouncementByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.announcement = response.data;
      }
    });
  }

}
