import { Injectable } from '@angular/core';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Settings } from '../models/settings';

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
          tap(settings => this._settings = settings)
        );
    }
  }

  set(val: Settings) {
    this._settings = val;
    return this.settingsService.set(val);
  }
}