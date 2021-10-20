export namespace Alma {
  export interface Collections {
    collection: Collection[]
  }

  export interface Collection {
    pid: Value,
    parent_pid: Value,
    name: string,
    library: Value,
    collection?: Collection[],
  }

  export interface License {
    term: { code: Value, value: Value }[];
    code: string;
    name: string;
    resource: Resource[];
    licensor: Value;
  }

  export interface LicenseAttachments {
    total_record_count: number;
    attachment: LicenseAttachment[];
  }

  export interface LicenseAttachment {
    id: string;
    file_name: string;
    content: string;
    link: string;
    type: string;
  }

  export interface Resource {
    pid: string;
    name: string;
    type: Value;
  }

  export interface Value { 
    value: string;
    desc?: string;
  }

  export interface GeneralConfig {
    institution: Value;
    digital: {
      bucket: string;
      region: string;
      ingest_url: string;
      delivery_url: string;
      ingest_form: object
    }
  }

  export interface Bib {
    mms_id: string;
  }

  export interface Representation {
    id: string;
    link: string;
    delivery_url: string;
    files: {
      total_record_count: number,
      link: string
    },
  }

  export interface Representations {
    representation: Representation[];
  }

  export interface CodeTable {
    row: CodeTableRow[]
  }

  export interface CodeTableRow {
    code: string;
    description: string;
    enabled: boolean;
  }

  export interface Error {
    errorCode: string;
    errorMessage: string;
    trackingId: string;
  }
}

export const sortCodeTable = (table: Alma.CodeTable) => {
  table.row.sort((a, b) => a.description.localeCompare(b.description, undefined, {sensitivity: 'base'}))
  return table;
}

export const parseError = (err: any) => {
  const error = err.error;
  if (error && error.errorList && Array.isArray(error.errorList.error) && error.errorList.error.length > 0) {
    return error.errorList.error[0] as Alma.Error
  } else {
    return undefined;
  }
}

export const templateNamespaces = {
  dc: "http://purl.org/dc/elements/1.1/",
  dcterms: "http://purl.org/dc/terms/",
}

export const dcTemplate = `
  <bib>
  <suppress_from_publishing>false</suppress_from_publishing>
  <record_format>dc</record_format>
  <record ${Object.entries(templateNamespaces).map(([k, v]) => `xmlns:${k}="${v}"`).join(" ")}>
  </record>
  </bib>
`

export const parseLicense = (code: string, license: Alma.License): string => {
  switch (code) {
    case 'LICENSE_NAME':
      return license.name;
    case 'LICENSE_CODE':
      return license.code;
    case 'LICENSE_LICENSOR':
      return license.licensor.desc;
    case 'LICENSE_TERM_YEAR':
      const term = license.term.find(t => t.code.value == 'YEAR');
      return term ? term.value.value : '0000';
    case 'CURRENT_YEAR':
      return new Date().getFullYear().toString();
    default:
      return '';
  }
}