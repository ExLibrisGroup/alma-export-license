import { Component, Input, OnInit } from "@angular/core";
import { FormArray } from "@angular/forms";
import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";
import { DialogService } from "eca-components";
import { MetadataField } from "../../models/settings";
import { AddMetadataMappingDialog } from "./add-metadata-mapping-dialog.component";

@Component({
  selector: 'app-metadata-mapping',
  templateUrl: './metadata-mapping.component.html',
  styleUrls: ['./metadata-mapping.component.scss']
})
export class MetadataMappingComponent implements OnInit {

  @Input() metadata: FormArray;

  constructor(
    private dialog: DialogService,
  ) {}

  ngOnInit() {

  }

  add() {
    this.dialog.prompt(AddMetadataMappingDialog, {
      title: 'SETTINGS.METADATA_MAPPING.ADD',
    })
    .subscribe((field: MetadataField) => {
      if (!field) return;
      if (field.field && field.value) {
        this.metadata.push(FormGroupUtil.toFormGroup(field));
        this.metadata.markAsDirty();
      }
    })
  }

  remove(index: number) {
    this.metadata.removeAt(index);
    this.metadata.markAsDirty();
  }
}