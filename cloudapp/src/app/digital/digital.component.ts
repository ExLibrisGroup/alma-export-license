import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { map, switchMap, tap } from 'rxjs/operators';
import { Alma } from '../models/alma';
import { AlmaService } from '../services/alma.service';
import { DataService } from '../services/data.service';
import { UploadFile, UploadService } from '../services/upload.service';
import * as XLSX from 'xlsx';
import { Observable, of } from 'rxjs';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { s2ab, selectSingleNode } from '../utils';
import { ProgressTrackerComponent } from '../progress-tracker/progress-tracker.component';
import { DialogService } from 'eca-components';
import { TranslateService } from '@ngx-translate/core';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Component({
  selector: 'app-digital',
  templateUrl: './digital.component.html',
  styleUrls: ['./digital.component.scss']
})
export class DigitalComponent implements OnInit {
  file: UploadFile;
  license: Alma.License;
  key: string;
  loading = false;
  progress = 0;
  delivery_url: string;
  @ViewChild(ProgressTrackerComponent, { static: false }) progressTracker: ProgressTrackerComponent;

  steps = [
    'RETRIEVING_LICENSE',
    'SEARCH_EXISTING',
    'UPLOADING',
    'CREATING_BIB',
    'ADD_BIB_TO_COLLECTION',
    'CREATING_REPRESENTATION',
    'ADDING_FILE_TO_REPRESENTATION',
  ]

  constructor(
    private uploadService: UploadService,
    public data: DataService,
    private alma: AlmaService,
    private alert: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: DialogService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.process();
  }

  process() {
    this.loading = true;
    this.changeDetectorRef.detectChanges(); // required for ViewChild in ngIf?
    this.getLicense()
    .pipe(
      switchMap(license => this.searchExisting(license)),
      switchMap(() => this.upload().pipe(tap(result => this.key = result))),
      switchMap(() => this.createBib()),
      switchMap(bib => this.addBibToCollection(bib)),
      switchMap(bib => this.createRepresentation(bib)),
      switchMap(representation => this.addFileToRepresentation(representation)),
    )
    .subscribe({
      next: (representation: Alma.Representation) => {
        this.progressTracker.complete();
        setTimeout(() => {
          this.loading = false;
          this.delivery_url = representation.delivery_url;
        }, 2000);
      },
      error: e => {
        this.loading = false;
        this.alert.error(e.message || this.translate.instant('ERROR'));
      }
    });
  }

  createBib() {
    this.progressTracker.setProgress('CREATING_BIB');
    return this.alma.createBib(this.license.name);
  }

  addBibToCollection(bib: Alma.Bib) {
    this.progressTracker.setProgress('ADD_BIB_TO_COLLECTION');
    return this.alma.addBibToCollection(bib.mms_id, this.data.selectedCollection.id)
  }

  createRepresentation(bib: Alma.Bib) {
    this.progressTracker.setProgress('CREATING_REPRESENTATION');
    return this.alma.createRepresentation(bib.mms_id);
  }

  addFileToRepresentation(rep: Alma.Representation) {
    this.progressTracker.setProgress('ADDING_FILE_TO_REPRESENTATION');
    return this.alma.addFileToRepresentation(rep, this.key)
  }

  getLicense() {
    this.progressTracker.setProgress('RETRIEVING_LICENSE');
    return this.alma.getLicense(this.data.licenseCode)
    .pipe(
      tap(license => this.license = license),
    );
  }

  searchExisting(license: Alma.License) {
    this.progressTracker.setProgress('SEARCH_EXISTING');
    let q = `alma.mms_memberOfDeep=${this.data.selectedCollection.id} and alma.title="${license.name}"`
    return this.alma.search(q)
    .pipe(
      map(result => {
        const doc = new DOMParser().parseFromString(result, "text/xml");
        let numberOfRecords = selectSingleNode(doc, `/default:searchRetrieveResponse/default:numberOfRecords`);
        return numberOfRecords;
      }),
      switchMap(result => parseInt(result) > 0 ?
          this.dialog.confirm({
            title: 'DIGITAL.EXISTING_DIALOG.TITLE',
            text: 'DIGITAL.EXISTING_DIALOG.TEXT',
            ok: 'DIGITAL.EXISTING_DIALOG.OK',
            cancel: 'DIGITAL.EXISTING_DIALOG.CANCEL'
          }) :
          of(true)
      ),
      tap(result => {
        if (!result) throw new Error(this.translate.instant('DIGITAL.EXISTING_ERROR'))
      })
    )
  }

  upload(): Observable<string> {
    this.progressTracker.setProgress('UPLOADING')
    const wb = this.data.buildExcel(this.license);
    const out = XLSX.write(wb, { bookType:'xlsx',  type: 'binary' });
    this.file = {
      inProgress: false,
      data: new File(
        [s2ab(out)], 
        `${this.license.code}.xlsx`, 
        { type: EXCEL_MIME_TYPE }
      ),
      progress: 0
    }
    return this.uploadService.upload(this.file);
  }

}
