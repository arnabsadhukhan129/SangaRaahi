import {Component, Inject, OnInit} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";
import {DialogDataModel} from "../../models/dialog-data.model";

@Component({
  selector: 'app-active-inactive-dialog',
  templateUrl: './active-inactive-dialog.component.html',
  styleUrls: ['./active-inactive-dialog.component.scss']
})
export class ActiveInactiveDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ActiveInactiveDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogDataModel) { }

  ngOnInit(): void {
  }

  onYesClick() {
    this.dialogRef.close(true);
  }

  onNoBtnClick(): void {
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
