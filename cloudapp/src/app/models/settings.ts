import { FormGroupUtil } from "@exlibris/exl-cloudapp-angular-lib";
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

export class Settings {
  includeAttachments: boolean = true;
  overwriteWarning: boolean = true;
  includeInventory: boolean = true;
  licenseTerms: 'all' | string[] = 'all';
  rootCollectionId: string = "";
  rootCollectionFullName: string = "";
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
  'dc:date',
  'dcterms:modified'
]

export const CollectionPathOptions = [
  _('SETTINGS.COLLECTION_PATH_OPTIONS.LICENSE_NAME'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.LICENSE_CODE'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.LICENSE_LICENSOR'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.LICENSE_TERM_YEAR'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.CURRENT_YEAR'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.CREATION_DATE'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.UPDATE_DATE'),
  _('SETTINGS.COLLECTION_PATH_OPTIONS.LICENSE_TERM_DESCRIPTION'),
];

export const settingsFormGroup = (settings: Settings) => FormGroupUtil.toFormGroup(settings);