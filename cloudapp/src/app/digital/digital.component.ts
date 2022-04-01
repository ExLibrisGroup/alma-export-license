import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { defaultIfEmpty, last, map, switchMap, tap } from 'rxjs/operators';
import { Alma } from '../models/alma';
import { AlmaService } from '../services/alma.service';
import { DataService } from '../services/data.service';
import { UploadFile, UploadService } from '../services/upload.service';
import * as XLSX from 'xlsx';
import { concat, forkJoin, Observable, of } from 'rxjs';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { dataToFile, s2ab, selectText } from '../utils';
import { ProgressTrackerComponent } from '../progress-tracker/progress-tracker.component';
import { DialogService } from 'eca-components';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from '../models/settings';
import { SettingsService } from '../services/settings.service';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Component({
  selector: 'app-digital',
  templateUrl: './digital.component.html',
  styleUrls: ['./digital.component.scss']
})
export class DigitalComponent implements OnInit {
  files: UploadFile[] = [];
  license: Alma.License;
  keys: string[];
  loading = false;
  settings: Settings;
  delivery_url: string;
  mmsId: string;
  updated_date: Date;
  @ViewChild(ProgressTrackerComponent, { static: false }) progressTracker: ProgressTrackerComponent;

  steps = [
    _('DIGITAL.PROGRESS.RETRIEVING_LICENSE'),
    _('DIGITAL.PROGRESS.SEARCH_EXISTING'),
    _('DIGITAL.PROGRESS.RETRIEVING_ATTACHMENTS'),
    _('DIGITAL.PROGRESS.UPLOADING'),
    _('DIGITAL.PROGRESS.CREATING_COLLECTIONS'),
    _('DIGITAL.PROGRESS.CREATING_BIB'),
    _('DIGITAL.PROGRESS.ADD_BIB_TO_COLLECTION'),
    _('DIGITAL.PROGRESS.CREATING_REPRESENTATION'),
    _('DIGITAL.PROGRESS.ADDING_FILE_TO_REPRESENTATION'),
  ]

  constructor(
    private uploadService: UploadService,
    public data: DataService,
    private alma: AlmaService,
    private alert: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: DialogService,
    private translate: TranslateService,
    private settingsService: SettingsService,
  ) { }

  ngOnInit() {
    this.process();
  }

  process() {
    this.loading = true;
    this.changeDetectorRef.detectChanges(); // required for ViewChild in ngIf?
    this.getSettings()
    .pipe(
      switchMap(() => this.getLicense()),
      switchMap(license => this.searchExisting(license)),
      switchMap(() => this.getAttachments()),
      switchMap(() => this.upload().pipe(tap(result => this.keys = result))),
      switchMap(() => this.createCollectionTree()),
      switchMap(() => this.createBib()),
      switchMap(bib => this.addBibToCollection(bib)),
      switchMap(bib => this.createRepresentation(bib)),
      switchMap(representation => this.addFilesToRepresentation(representation)),
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

  getSettings() {
    return this.settingsService.get().pipe(tap(settings => this.settings = settings));
  }

  createBib() {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.CREATING_BIB');
    return this.alma.createOrUpdateBibFromLicense(this.license, this.mmsId, this.settings.metadata)
    .pipe(tap(bib => this.mmsId = bib.mms_id));
  }

  createCollectionTree() {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.CREATING_COLLECTIONS');
    if (!this.data.collectionPath) {
      this.data.collectionId = this.settings.rootCollectionId;
      return of(true);
    }
    return this.alma.createCollectionTree(this.settings.rootCollectionId, this.data.collectionPath.split('/'))
    .pipe(tap(collection => this.data.collectionId = collection.pid.value));
  }

  addBibToCollection(bib: Alma.Bib) {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.ADD_BIB_TO_COLLECTION');
    return this.alma.addBibToCollection(bib.mms_id, this.data.collectionId)
  }

  createRepresentation(bib: Alma.Bib) {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.CREATING_REPRESENTATION');
    return this.alma.createRepresentation(bib.mms_id);
  }

  addFilesToRepresentation(rep: Alma.Representation) {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.ADDING_FILE_TO_REPRESENTATION');
    const files = this.keys.map(key => this.alma.addFileToRepresentation(rep, key));
    return concat(...files).pipe(last());
  }

  getLicense() {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.RETRIEVING_LICENSE');
    return this.alma.getLicense(this.data.licenseCode)
    .pipe(
      tap(license => this.license = license),
    );
  }

  getAttachments() {
    if (!this.settings.includeAttachments) return of(false);
    this.progressTracker.setProgress('DIGITAL.PROGRESS.RETRIEVING_ATTACHMENTS')
    return this.alma.getLicenseAttachments(this.data.licenseCode)
    .pipe(
      map(attachments => attachments.attachment.map(attachment => this.alma.getLicenseAttachment(attachment.link))),
      switchMap(attachments => forkJoin(attachments).pipe(defaultIfEmpty([]))),
      tap(results => results.forEach(result => this.files.push(this.attachmentToUploadFile(result)))),
    )
  }

  private attachmentToUploadFile(attachment: Alma.LicenseAttachment) {
    return new UploadFile(dataToFile(attachment.content, attachment.file_name, attachment.type))
  }

  searchExisting(license: Alma.License) {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.SEARCH_EXISTING');
    let q = `alma.identifier=${license.code}`;
    return this.alma.search(q)
    .pipe(
      map(result => {
        const doc = new DOMParser().parseFromString(result, "text/xml");
        this.mmsId = selectText(doc, '/default:searchRetrieveResponse/default:records/default:record/default:recordIdentifier');
        return this.mmsId;
      }),
      switchMap(result => !!result && this.settings.overwriteWarning ?
          this.dialog.confirm({
            title: _('DIGITAL.EXISTING_DIALOG.TITLE'),
            text: _('DIGITAL.EXISTING_DIALOG.TEXT'),
            ok: _('DIGITAL.EXISTING_DIALOG.OK'),
            cancel: _('DIGITAL.EXISTING_DIALOG.CANCEL'),
          }) :
          of(true)
      ),
      tap(result => {
        if (!result) throw new Error(this.translate.instant('DIGITAL.EXISTING_ERROR'))
      })
    )
  }

  upload(): Observable<string[]> {
    this.progressTracker.setProgress('DIGITAL.PROGRESS.UPLOADING');
    return this.data.buildTsv()
    .pipe(
      map(wb => {
        const file = new File(
          [wb], 
          `${this.data.licenseCode}.tsv`, 
          { type: "text/plain" }
        )
        this.files.push(new UploadFile(file));
      }),
      switchMap(() => this.uploadService.upload(this.files))
    )
  }

}
