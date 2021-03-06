import { Component, Injectable, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CanDeactivate } from '@angular/router';
import { DialogService, PromptDialogData } from 'eca-components';
import { Observable, of } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { CollectionPickerDialog } from '../collection-picker/collection-picker.component';
import { Alma } from '../models/alma';
import { Collection } from '../models/collection';
import { settingsFormGroup } from '../models/settings';
import { AlmaService } from '../services/alma.service';
import { SettingsService } from '../services/settings.service';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  form: FormGroup;
  saving = false;
  licenseTerms: Alma.CodeTableRow[] = [];

  constructor(
    private settingsService: SettingsService,
    private alma: AlmaService,
    private dialog: DialogService,
  ) { }

  ngOnInit() {
    this.settingsService.get().subscribe(settings => {
      this.form = settingsFormGroup(settings);
    });
    this.alma.getLicenseTerms()
    .subscribe(results => this.licenseTerms = results.row);
  }

  save() {
    this.saving = true;
    this.settingsService.set(this.form.value)
    .pipe(finalize(() => this.saving = false))
    .subscribe(
      () => this.form.markAsPristine()
    );
  }

  get allLicenseTerms() {
    return this.form.get('licenseTerms').value == 'all';
  }
  set allLicenseTerms(val: boolean) {
    this.form.setControl('licenseTerms', val ? new FormControl('all') : new FormArray([]));
    this.form.markAsDirty();
  }

  onTermToggled(event: MatSlideToggleChange, code: string) {
    if (event.checked) {
      this.selectedLicenseTerms.push(new FormControl(code));
    } else {
      let index = this.selectedLicenseTerms.value.indexOf(code);
      if (~index) {
        this.selectedLicenseTerms.removeAt(index);
      }
    }
    this.selectedLicenseTerms.markAsDirty();
  }

  selectRootCollection() {
    const dialogData: PromptDialogData = { 
      title: _('COLLECTION_PICKER.TITLE'), 
      val: { id: this.form.get('rootCollectionId').value },
    }
    this.dialog.prompt(CollectionPickerDialog, dialogData)
    .subscribe((result: Collection) => {
      if (!result) return;
      this.form.patchValue({ rootCollectionId: result.id, rootCollectionFullName: result.fullname });
      this.form.markAsDirty();
    });
  }

  get selectedLicenseTerms() {
    return this.form.get('licenseTerms') as FormArray;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SettingsGuard implements CanDeactivate<SettingsComponent> {
  constructor(
    private dialog: DialogService,
  ) {}

  canDeactivate(component: SettingsComponent): Observable<boolean> {
    if(!component.form.dirty) return of(true);
    return this.dialog.confirm({ 
      text: _('SETTINGS.DISCARD'),
      ok: _('SETTINGS.DISCARD_OK'),
    });
  }
}