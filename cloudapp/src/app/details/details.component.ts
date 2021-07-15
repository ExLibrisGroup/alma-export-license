import { Component, OnInit } from '@angular/core';
import { DialogService, PromptDialogData } from 'eca-components';
import { finalize } from 'rxjs/operators';
import { CollectionPickerDialog } from '../collection-picker/collection-picker.component';
import { Collection } from '../models/collection';
import { AlmaService } from '../services/alma.service';
import { DataService } from '../services/data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  loading = false;

  constructor(
    public data: DataService,
    private alma: AlmaService,
    private dialog: DialogService,
  ) { }

  ngOnInit() {
  }

  selectCollection() {
    const dialogData: PromptDialogData = { 
      title: 'COLLECTION_PICKER.TITLE', 
      val: this.data.selectedCollection,
    }
    this.dialog.prompt(CollectionPickerDialog, dialogData)
    .subscribe((result: Collection) => {
      if (!result) return;
      this.data.selectedCollection = result;
    });
  }

  download() {
    this.loading = true;
    this.alma.getLicense(this.data.licenseCode)
    .pipe(finalize(() => this.loading = false))
    .subscribe(license => {
      const wb = this.data.buildExcel(license);
      XLSX.writeFile(wb, `${license.code}.xlsx`);
    })
  }
}

