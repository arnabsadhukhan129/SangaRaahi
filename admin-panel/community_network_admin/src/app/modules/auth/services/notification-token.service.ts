import { Injectable } from '@angular/core';
import { MessagePayload, getMessaging, getToken, onMessage } from "firebase/messaging";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationTokenService {

  constructor() { }

  requestPermissionForNotification(): Promise<string> {
    const messaging = getMessaging();
    // console.log("messaging....",messaging);
    
    return getToken(messaging, {
      vapidKey: environment.firebase.vapidKey,
    })
  }
}
