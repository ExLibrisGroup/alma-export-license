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