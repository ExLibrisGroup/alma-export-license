import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Alma } from '../models/alma';
import { settingsFormGroup } from '../models/settings';
import { AlmaService } from '../services/alma.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  form: FormGroup;
  saving = false;
  licenseTerms: Alma.CodeTableRow[] = [];
  private unsubscribe = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
    private alma: AlmaService,
  ) { }

  ngOnInit() {
    this.settingsService.get().subscribe(settings => {
      this.form = settingsFormGroup(settings);
      this.form.valueChanges.pipe(
        debounceTime(750),
        tap(() => this.saving = true),
        switchMap(formValue => this.settingsService.set(formValue)
        .pipe(finalize(() => this.saving = false)
        )),
        takeUntil(this.unsubscribe),
      ).subscribe()
    });
    this.alma.getLicenseTerms()
    .pipe(tap(results => this.licenseTerms = results.row))
    .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribe.next()
  }

  get allLicenseTerms() {
    return this.form.get('licenseTerms').value == 'all';
  }
  set allLicenseTerms(val: boolean) {
    this.form.setControl('licenseTerms', val ? new FormControl('all') : new FormArray([]))
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
  }

  get selectedLicenseTerms() {
    return this.form.get('licenseTerms') as FormArray;
  }

}
