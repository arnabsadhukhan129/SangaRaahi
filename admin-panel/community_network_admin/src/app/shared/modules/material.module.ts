import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import {MatLegacyTooltipModule as MatTooltipModule} from '@angular/material/legacy-tooltip';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatLegacyCardModule as MatCardModule} from '@angular/material/legacy-card';
import {MatDividerModule} from '@angular/material/divider';
import {MatLegacyMenuModule as MatMenuModule} from '@angular/material/legacy-menu';
import {MatLegacyListModule as MatListModule} from '@angular/material/legacy-list';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {MatLegacyFormFieldModule as MatFormFieldModule} from '@angular/material/legacy-form-field';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatLegacySelectModule as MatSelectModule} from '@angular/material/legacy-select';
import {MatLegacyProgressSpinnerModule as MatProgressSpinnerModule} from '@angular/material/legacy-progress-spinner';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatLegacyTableModule as MatTableModule} from '@angular/material/legacy-table';
import {MatLegacyTabsModule as MatTabsModule} from '@angular/material/legacy-tabs';
import {MAT_LEGACY_SNACK_BAR_DEFAULT_OPTIONS as MAT_SNACK_BAR_DEFAULT_OPTIONS, MatLegacySnackBarModule as MatSnackBarModule} from '@angular/material/legacy-snack-bar';
import {MatLegacyProgressBarModule as MatProgressBarModule} from '@angular/material/legacy-progress-bar';
import {MatLegacyPaginatorModule as MatPaginatorModule} from '@angular/material/legacy-paginator';
import {MatLegacyRadioModule as MatRadioModule} from '@angular/material/legacy-radio';
import {MatTreeModule} from '@angular/material/tree';
import {MAT_LEGACY_DIALOG_DEFAULT_OPTIONS as MAT_DIALOG_DEFAULT_OPTIONS, MatLegacyDialogModule as MatDialogModule} from "@angular/material/legacy-dialog";
import {MatLegacyAutocompleteModule as MatAutocompleteModule} from '@angular/material/legacy-autocomplete';
import {MatSortModule} from '@angular/material/sort';
import {MatLegacySlideToggleModule as MatSlideToggleModule} from '@angular/material/legacy-slide-toggle';
import {NgxMatDatetimePickerModule, NGX_MAT_DATE_FORMATS, NgxMatDatepickerToggle} from '@angular-material-components/datetime-picker';
import {NgxMatMomentModule} from '@angular-material-components/moment-adapter';

const materialmodule = [
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatTooltipModule,
  MatSidenavModule,
  MatCardModule,
  MatDividerModule,
  MatMenuModule,
  MatListModule,
  MatInputModule,
  MatFormFieldModule,
  MatGridListModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatExpansionModule,
  MatTableModule,
  MatTabsModule,
  MatSnackBarModule,
  MatProgressBarModule,
  MatPaginatorModule,
  MatRadioModule,
  MatTreeModule,
  MatDialogModule,
  MatAutocompleteModule,
  MatSortModule,
  MatSlideToggleModule,
  NgxMatDatetimePickerModule,
  NgxMatMomentModule
  // Add more material module here
]
@NgModule({
  declarations: [],
  imports: [materialmodule],
  exports: [materialmodule],
  providers:[
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 3000}},
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}},
    {
      provide: NGX_MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'L',
          monthInput: 'MMMM',
          timeInput: 'LT',
          datetimeInput: 'L LT'
        },
        display: {
          dateInput: 'L',
          monthInput: 'MMMM',
          datetimeInput: 'L LT',
          timeInput: 'LT',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
          popupHeaderDateLabel: 'ddd, DD MMM'
        }
      }
    }
  ],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class MaterialModule { }
