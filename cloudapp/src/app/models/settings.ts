import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";
import { merge } from 'lodash';

export class Settings {
  includeAttachments: boolean = true;
  licenseTerms: 'all' | string[] = 'all';
}

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(merge(new Settings(), settings));