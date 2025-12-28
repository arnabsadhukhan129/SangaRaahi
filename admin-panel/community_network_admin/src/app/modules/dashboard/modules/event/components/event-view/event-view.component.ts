import { Component, OnInit } from '@angular/core';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Event} from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-event-view',
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss']
})
export class EventViewComponent implements OnInit {
  event!: Event;
  eventFrom: any;
  eventTo: any;
  rsvpend:any;
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getEventById();
  }

  getEventById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAdminEventByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getAdminEventByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.eventFrom = new Date(Date.parse(response.data.time.from)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"});
        this.eventTo = new Date(Date.parse(response.data.time.to)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"});
        this.rsvpend = new Date(Date.parse(response.data.rsvpEndTime)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"});
        this.event = response.data;
      }
    });
  }

}
