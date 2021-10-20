import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";

export class Settings {
  includeAttachments: boolean = true;
  overwriteWarning: boolean = true;
  includeInventory: boolean = true;
  licenseTerms: 'all' | string[] = 'all';
  collectionPath: string[] = [];
  metadata: MetadataField[] = [
    { field: "dc:title", value: "LICENSE_NAME" },
    { field: "dc:identifier", value: "LICENSE_CODE" },
  ];
}

export class MetadataField {
  field: string = "";
  value: string = "";
  text?: string;
}

export const MetadataFieldOptions = [
  'dc:title',
  'dc:identifier',
  'dc:description', 
  'dc:publisher',
  'dcterms:issued',
  'dcterms:valid',
  'dc:type',
  'dc:language',
  'dcterms:accessRights',
  'dcterms:provenance',
]

export const CollectionPathOptions = [
  'LICENSE_NAME',
  'LICENSE_CODE',
  'LICENSE_LICENSOR',
  'CURRENT_YEAR',
];

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(settings);