import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";

export class Settings {
  includeAttachments: boolean = true;
  overwriteWarning: boolean = true;
  includeInventory: boolean = true;
  licenseTerms: 'all' | string[] = 'all';
  collectionPath: string[] = [];
}

export const CollectionPathOptions = [
  'LICENSE_NAME',
  'LICENSE_CODE',
  'LICENSE_LICENSOR',
  'CURRENT_YEAR',
];

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(settings);