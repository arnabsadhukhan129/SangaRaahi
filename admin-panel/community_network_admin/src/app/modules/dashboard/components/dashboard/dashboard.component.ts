import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavItem } from '../../models/nav-item.model';
import { NavServiceService } from '../../services/nav-service.service';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Router , ActivatedRoute} from '@angular/router';
import {AuthService} from "../../../../shared/services/auth/auth.service";
import { DialogService } from 'src/app/shared/services/dialog.service';
import {DialogDataModel, AlertDialogDataModel, DisplayPdfModel} from 'src/app/shared/models/dialog-data.model';
import {DialogAction, AlertDialogAction, DisplayPdfAction} from "src/app/shared/enums/common.enums";
import { from } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  name : String;
  hasNewNotifications: boolean = false
  @ViewChild('drawer') appDrawer!: ElementRef;
  showFiller = false;
  themeColor: 'primary' | 'accent' | 'warn' = 'primary'; // ? notice this
  isDark = false; // ? notice this
  menus = ['Users', 'Communities', 'Member', 'Group', 'Events', 'Messages'];
  navItems: NavItem[] = [
    {
      displayName: 'Dashboard',
      iconName: 'assignment',
      route: '',
      // children: [
      //   {
      //     displayName: 'Create',
      //     disabled: false,
      //     iconName: 'add_box',
      //     route: 'community/create',
      //   },
      //   {
      //     displayName: 'List',
      //     disabled: false,
      //     iconName: 'visibility',
      //     route: 'community',
      //   },
      // ],
    },
    {
      displayName: 'Users',
      iconName: 'person',
      children: [
        {
          displayName: 'Create',
          disabled: false,
          iconName: 'add_box',
          route: 'user/create',
        },
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'user',
        },
      ],
    },
    {
      displayName: 'Communities',
      iconName: 'groups',
      children: [
        {
          displayName: 'Create',
          disabled: false,
          iconName: 'add_box',
          route: 'community/create',
        },
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'community',
        },
      ],
    },
    {
      displayName: 'Group',
      iconName: 'group',
      children: [
        {
          displayName: 'Create',
          disabled: false,
          iconName: 'add_box',
          route: 'group/create',
        },
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'group',
        },
      ],
    },
    {
      displayName: 'Announcement',
      iconName: 'announcement',
      children: [
        {
          displayName: 'Create',
          disabled: false,
          iconName: 'add_box',
          route: 'announcement/create',
        },
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'announcement',
        },
      ],
    },
    {
      displayName: 'Events',
      iconName: 'event_note',
      children: [
        {
          displayName: 'Create',
          disabled: false,
          iconName: 'add_box',
          route: 'event/create',
        },
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'event',
        },
      ],
    },
    {
      displayName: 'Messages',
      iconName: 'forum',
      children: [
        {
          displayName: 'List',
          disabled: false,
          iconName: 'visibility',
          route: 'message',
        },
      ],
    },
    {
      displayName: 'SMS/Emails Credit',
      iconName: 'email',
      children: [
        {
          displayName: 'Credits Remaining',
          disabled: false,
          iconName: 'local_atm',
          route: 'sms-emails-credits-remaining',
        },
      ],
    },
    {
      displayName: 'Notification',
      iconName: 'notifications',
      children: [
        {
          displayName: 'Notification List',
          disabled: false,
          iconName: 'playlist_add_check',
          route: 'notification/list',
        },
      ],
    },
    {
      displayName: 'Geofencing Setting',
      iconName: 'settings',
      children: [
        {
          displayName: 'Setting',
          disabled: false,
          iconName: 'settings',
          route: 'geofecingSetting',
        },
      ],
    }
  ];

  constructor(
    private navService: NavServiceService,
    private authService:AuthService,
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.getMyProfileDetails();
  }

  ngAfterViewInit() {
    this.navService.appDrawer = this.appDrawer;
  }
  getMyProfileDetails() {
    this.loaderService.show();
    this.apolloClient.setModule('getMyProfileDetails').queryData().subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.name = response.data.user.name;
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  notificationModal(){
    const data: AlertDialogDataModel = {
      dialogMessage:"Notification List",
    };
    this.dialogService.openNotificationDialog(AlertDialogAction.ALERT, data).subscribe(result => {
      if(result) {
      }
    });
    this.hasNewNotifications = false;
  }

  getMessage(event:any){
    this.hasNewNotifications = true;
  }
}
