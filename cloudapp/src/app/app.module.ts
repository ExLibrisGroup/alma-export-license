import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule, CloudAppTranslateModule, AlertModule } from '@exlibris/exl-cloudapp-angular-lib';
import { DialogModule, SelectEntitiesModule } from 'eca-components';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';
import { DetailsComponent } from './details/details.component';
import { CollectionPickerDialog } from './collection-picker/collection-picker.component';
import { DigitalComponent } from './digital/digital.component';
import { ProgressTrackerComponent } from './progress-tracker/progress-tracker.component';
import { SettingsComponent } from './settings/settings.component';
import { CollectionPathComponent } from './settings/collection-path.component';

@NgModule({
  declarations: [					
    AppComponent,
    MainComponent,
    DetailsComponent,
    CollectionPickerDialog,
    DigitalComponent,
    ProgressTrackerComponent,
    SettingsComponent,
    CollectionPathComponent,
   ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,     
    CloudAppTranslateModule.forRoot(),
    SelectEntitiesModule,
    DialogModule,
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'standard' } },
  ],
  bootstrap: [AppComponent],
  entryComponents: [CollectionPickerDialog]
})
export class AppModule { }
