import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';
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

  buildExcel() {
    return forkJoin([
      this.settings.get(),
      this.alma.getLicense(this.licenseCode)
    ])
    .pipe(
      map(results => {
        const [ settings, license ] = results;
        /* generate workbook */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();

        /* convert terms */
        if (settings.licenseTerms != 'all') {
          license.term = license.term.filter(t => settings.licenseTerms.includes(t.code.value))
        }
        const terms = license.term.map(term => [term.code.desc, term.value.desc])
        terms.unshift(Object.values(this.translate.instant(['EXCEL.HEADERS.TERM_NAME', 'EXCEL.HEADERS.TERM_VALUE'])));
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(terms);    
        XLSX.utils.book_append_sheet(wb, ws, this.translate.instant('EXCEL.TERMS'));


        /* Convert portfolios */
        if (settings.includeInventory) {
          const resources = license.resource.map(resource => [resource.name, resource.type.desc]);
          resources.unshift(Object.values(this.translate.instant(['EXCEL.HEADERS.RESOURCE', 'EXCEL.HEADERS.RESOURCE_TYPE'])))  
          const ws2: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(resources);
          XLSX.utils.book_append_sheet(wb, ws2, this.translate.instant('EXCEL.PORTFOLIOS'));
        }

        return wb;
      })
    )

  }
}