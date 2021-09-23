import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { settingsFormGroup } from '../models/settings';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  form: FormGroup;
  saving = false;
  private unsubscribe = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.settingsService.get().subscribe(settings => {
      this.form = settingsFormGroup(settings);
      this.form.valueChanges.pipe(
        debounceTime(500),
        tap(() => this.saving = true),
        switchMap(formValue => this.settingsService.set(formValue)
        .pipe(finalize(() => this.saving = false)
        )),
        takeUntil(this.unsubscribe),
      ).subscribe()
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next()
  }

}
