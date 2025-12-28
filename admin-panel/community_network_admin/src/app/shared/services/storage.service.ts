import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  constructor() { }

  setLocalStorageItem(key:string, data:any) {
    switch(typeof data) {
      case "object":
        data = JSON.stringify(data);
        break;
      case 'number':
        data = data + '';
        break;
    }
    localStorage.setItem(key, data);
  }

  getLocalStorageItem(key:string, defaultValue:string = "") {
    const data = localStorage.getItem(key);
    return data || defaultValue;
  } 

  removeLocalItem(key:string) {
    localStorage.removeItem(key);
  }

  setSessionItem(key:string, data:any) {
    switch(typeof data) {
      case "object":
        data = JSON.stringify(data);
        break;
      case 'number':
        data = data + '';
        break;
    }
    sessionStorage.setItem(key, data);
  }

  getSessionItem(key:string, defaultValue:string = "") {
    const data = sessionStorage.getItem(key);
    return data || defaultValue;
  }

  removeSessionItem(key:string) {
    sessionStorage.removeItem(key);
  }

  hasLocalItem(key:string) {
    return !(!localStorage.getItem(key));
  }
  hasSessionItem(key:string) {
    return !(!sessionStorage.getItem(key));
  }

}
