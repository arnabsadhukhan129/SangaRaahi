import {Component, Inject, OnInit} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {AlertDialogDataModel} from "../../models/dialog-data.model";

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataModel) { 
                dialogRef.disableClose = true; 
              }

  ngOnInit(): void {
  }

  onYesClick() {
    this.dialogRef.close(true);
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
