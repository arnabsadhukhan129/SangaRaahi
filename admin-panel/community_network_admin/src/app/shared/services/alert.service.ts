import { Injectable } from '@angular/core';
import {MatLegacySnackBar as MatSnackBar, MatLegacySnackBarRef as MatSnackBarRef} from '@angular/material/legacy-snack-bar';
@Injectable()
export class AlertService {

  constructor(private snackBar: MatSnackBar) { }

  error(message: string) {
    this.snackBar.open(message, undefined, {
      panelClass:['snackbar-error']
    });
  }

  success(message:string) {
    this.snackBar.open(message, undefined, {
      panelClass:['snackbar-success']
    });
  }

  message(message:string, action:string, config:any):MatSnackBarRef<any> {
    return this.snackBar.open(message, action, config);
  }

}
