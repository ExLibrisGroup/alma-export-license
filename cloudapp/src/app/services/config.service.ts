import { Injectable } from '@angular/core';
import { CloudAppConfigService } from '@exlibris/exl-cloudapp-angular-lib';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ConfigService { 
  _config: any;

  constructor(
    private configuration: CloudAppConfigService,
  ) { }

  get() {
    if (this._config) return of(this._config);

    return this.configuration.get()
    .pipe(tap(config => this._config = config))
  }
}
