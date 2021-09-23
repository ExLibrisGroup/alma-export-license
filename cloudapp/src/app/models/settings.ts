import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";
import { merge } from 'lodash';

export class Settings {
  include_attachments: boolean = true;
}

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(merge(new Settings(), settings));