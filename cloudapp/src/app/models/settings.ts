import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";

export class Settings {
  includeAttachments: boolean = true;
  overwriteWarning: boolean = true;
  licenseTerms: 'all' | string[] = 'all';
}

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(settings);