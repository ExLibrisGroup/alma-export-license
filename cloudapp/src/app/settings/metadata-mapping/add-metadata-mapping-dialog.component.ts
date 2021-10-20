import { Inject } from "@angular/core";
import { Component } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from "@ngx-translate/core";
import { PromptDialog, PromptDialogData } from "eca-components";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { CollectionPathOptions, MetadataField, MetadataFieldOptions } from "../../models/settings";

@Component({
  selector: 'add-metadata-mapping-dialog',
  templateUrl: './add-metadata-mapping-dialog.component.html',
  styles: [
    '.mat-form-field { display: block; }',
  ]
})
export class AddMetadataMappingDialog extends PromptDialog {
  result = metadataMappingFormGroup(new MetadataField());

  fieldOptions = MetadataFieldOptions.sort();
  valueOptions = CollectionPathOptions;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Partial<PromptDialogData>,
    public translate: TranslateService,
    public dialogRef: MatDialogRef<PromptDialog>
  ) {
    super(data,translate,dialogRef);
  }
}

const textRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const field: MetadataField = control.value;
  return field.value == 'TEXT' && !field.text ? { msg: 'Text is required' } : null;
}

const metadataMappingFormGroup = (field: MetadataField) => {
  return new FormGroup({
    field: new FormControl(field.field, Validators.required),
    value: new FormControl(field.value, Validators.required),
    text: new FormControl(field.text)
  }, { validators: textRequired })
}
