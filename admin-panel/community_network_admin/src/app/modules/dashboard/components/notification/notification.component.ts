import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { MessagePayload, getMessaging, getToken, onMessage } from "firebase/messaging";
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';
// import firebase from 'firebase/app';
// import 'firebase/messaging';


@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  @Output() sendMessage:EventEmitter<boolean> = new EventEmitter<boolean>();
  message: MessagePayload | null = null;

  constructor(
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    // this.listen();
  }

  listen() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      // console.log('Message received. ', payload);
      this.message = payload;
      if(payload && payload.notification && payload.notification.title && payload.data && payload.data['body']) {
        // console.log("before....",payload.data['body']);
        this.alertService.success(payload.data['body']);
        // console.log("after....",payload.data['body']);
        this.sendMessage.emit(true);
      }
    });
  }
}
