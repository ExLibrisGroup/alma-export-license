import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AlmaService } from '../services/alma.service';
import { DataService } from '../services/data.service';
import { SettingsService } from '../services/settings.service';
import { Settings } from '../models/settings';
import { parseLicense } from '../models/alma';
import { mapi18n } from '../utils';
import { saveAs } from '../../../../node_modules/file-saver/src/FileSaver';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  loading = false;
  settings: Settings;

  constructor(
    public data: DataService,
    private alma: AlmaService,
    private settingsService: SettingsService,
  ) { }

  ngOnInit() {
    this.settingsService.get()
    .subscribe(settings => {
      this.settings = settings;
      this.populateCollectionPath(settings)
    });
  }

  download(){
    this.loading = true;
    this.data.buildTsv()
    .pipe(finalize(() => this.loading = false))
    .subscribe(wb => {
      saveAs(wb, `${this.data.licenseCode}.tsv`)
    })
  }

  populateCollectionPath(settings: Settings) {
    if (!this.data.licenseCode || settings.collectionPath.length == 0) return; 
    this.loading = true;
    this.alma.getLicense(this.data.licenseCode)
    .pipe(finalize(() => this.loading = false))
    .subscribe(license => {  
      this.data.collectionPath = settings.collectionPath.map(p => parseLicense(mapi18n(p), license)).join('/');
    })
  }
}

