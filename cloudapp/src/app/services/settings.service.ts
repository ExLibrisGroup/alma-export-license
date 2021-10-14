import { Injectable } from '@angular/core';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Settings } from '../models/settings';
import { merge } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private _settings: Settings;

  constructor(
    private settingsService: CloudAppSettingsService,
  ) { }

  get(): Observable<Settings> {
    if (this._settings) {
      return of(this._settings);
    } else {
      return this.settingsService.get()
        .pipe(
          map(settings => merge(new Settings(), settings)),
          tap(settings => this._settings = settings)
        );
    }
  }

  set(val: Settings) {
    this._settings = val;
    return this.settingsService.set(val);
  }
}