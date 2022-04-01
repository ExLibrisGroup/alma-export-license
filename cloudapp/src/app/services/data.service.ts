import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AlmaService } from './alma.service';

export const STORE_COLLECTION = 'Collection';

@Injectable({
  providedIn: 'root'
})
export class DataService { 
  licenseCode: string;
  public collectionPath: string;
  public collectionId: string;

  constructor(
    private translate: TranslateService,
    private settings: SettingsService,
    private alma: AlmaService,
  ) { }

  buildTsv() {
    return forkJoin([
      this.settings.get(),
      this.alma.getLicense(this.licenseCode)
    ])
    .pipe(
      map(results => {
        const [ settings, license ] = results;

        /* convert terms */
        if (settings.licenseTerms != 'all') {
          license.term = license.term.filter(t => settings.licenseTerms.includes(t.code.value))
        }
        const terms = license.term.map(term => [term.code.desc, term.value.desc])
        
        let str = this.translate.instant('EXCEL.HEADERS.TERM_NAME') + '\t' + this.translate.instant('EXCEL.HEADERS.TERM_VALUE') + "\n";
        for(let row of terms){
          for(let column of row){
            str += column + "\t";
          }
          str += "\n";  
        }

        /* Convert portfolios */
        if (settings.includeInventory) {
          str += "_________________________________________________________\n\n";
          const resources = license.resource.map(resource => [resource.name, resource.type.desc]);
          str += this.translate.instant('EXCEL.HEADERS.RESOURCE') + '\t' + this.translate.instant('EXCEL.HEADERS.RESOURCE_TYPE') + "\n";
          for(let row of resources){
            for(let column of row){
              str += column + "\t";
            }
            str += "\n";  
          }
        }

        let file = new Blob([str], { type: 'tsv;charset=utf-8'})
        return file;
      })
    )

  }
}