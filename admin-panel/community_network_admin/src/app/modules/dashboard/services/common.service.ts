import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private obj = new BehaviorSubject<number | null>(null);
  private val = this.obj.asObservable();
  constructor() { }

  sendValue(value:number){
    this.obj.next(value);
  }

  getValue(){
    return this.val;
  }
}
