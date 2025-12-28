import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SmsEmailRemainingService {
  private smsEmailSubject = new Subject<any>();
  smsEmail = this.smsEmailSubject.asObservable();

  private smsSubjectAdmin = new Subject<any>();
  smsdata = this.smsSubjectAdmin.asObservable();

  private emailSubjectAdmin = new Subject<any>();
  emaildata = this.emailSubjectAdmin.asObservable();

  constructor() { }

  emitData(val:number,type:string,action:string){
    this.smsEmailSubject.next({val:val,type:type,action:action});
  }

  getData(){
    return this.smsEmail;
  }

  emitAdminData(val:number){
    this.smsSubjectAdmin.next(val);
  }

  getAdminData(){
    return this.smsdata;
  }

  emitAdminEmailData(val:number){
    this.emailSubjectAdmin.next(val);
  }

  getAdminEmailData(){
    return this.emaildata;
  }
}
