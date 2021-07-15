import { Injectable } from '@angular/core';
import { CloudAppStoreService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Collection } from '../models/collection';
import { AlmaService } from './alma.service';
import { Alma } from '../models/alma';
import * as XLSX from 'xlsx';

export const STORE_COLLECTION = 'Collection';

@Injectable({
  providedIn: 'root'
})
export class DataService { 
  licenseCode: string;
  private _selectedCollection: Collection;
  private _collections: Collection[] = [];

  constructor(
    private alma: AlmaService,
    private store: CloudAppStoreService,
    private translate: TranslateService,
  ) {
    this.store.get(STORE_COLLECTION)
    .subscribe(collection => this._selectedCollection = collection);
  }

  get collections() {
    if (this._collections.length > 0) {
      return of(this._collections);
    }
    return this.alma.getCollections().pipe(
      tap(collections => this._collections = collections)
    )
  }

  set selectedCollection(collection: Collection) {
    this.store.set(STORE_COLLECTION, collection).subscribe();
    this._selectedCollection = collection;
  }

  get selectedCollection() {
    return this._selectedCollection;
  }

  buildExcel(license: Alma.License) {
    /* convert terms */
    const terms = license.term.map(term => [term.code.desc, term.value.desc])
    terms.unshift(Object.values(this.translate.instant(['EXCEL.HEADERS.TERM_NAME', 'EXCEL.HEADERS.TERM_VALUE'])));

    /* Convert portfolios */
    const resources = license.resource.map(resource => [resource.name, resource.type.desc]);
    resources.unshift(Object.values(this.translate.instant(['EXCEL.HEADERS.RESOURCE', 'EXCEL.HEADERS.RESOURCE_TYPE'])))

    /* generate worksheets */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(terms);
    const ws2: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(resources);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.translate.instant('EXCEL.TERMS'));
    XLSX.utils.book_append_sheet(wb, ws2, this.translate.instant('EXCEL.PORTFOLIOS'));

    return wb;
  }
}

const PORTFOLIOS = [
  [ 'Title 1' ],
  [ 'Title 2' ],
]