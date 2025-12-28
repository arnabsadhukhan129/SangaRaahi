import { NgModule } from '@angular/core';
import { MatButtonModule} from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {MatDialogModule} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
const MaterialComponents =[
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatDialogModule,
  MatCardModule,
  MatTableModule,
  MatProgressSpinnerModule,
  MatIconModule,
  MatMenuModule,
  MatToolbarModule
]
@NgModule({

  imports: [
    MaterialComponents,
  ],
  exports:[
    MaterialComponents
  ]
})
export class MaterialModule { }
