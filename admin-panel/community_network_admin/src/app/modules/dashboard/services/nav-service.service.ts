import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavServiceService {
  public appDrawer: any;

  constructor() { }

  public closeNav() {
    this.appDrawer.close();
  }

  public openNav() {
    this.appDrawer.open();
  }

}
