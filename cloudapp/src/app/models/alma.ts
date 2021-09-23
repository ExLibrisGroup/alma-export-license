export namespace Alma {
  export interface Collections {
    collection: Collection[]
  }

  export interface Collection {
    pid: {
      value: string,
      link: string
    },
    name: string,
    order: number,
    collection: Collection[],
  }

  export interface License {
    term: { code: Value, value: Value }[];
    code: string;
    name: string;
    resource: Resource[];
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
    desc: string;
  }

  export interface GeneralConfig {
    institution: Value;
    digital: {
      bucket: string;
      region: string;
      ingest_url: string;
      delivery_url: string;
      ingest_form: {
        acl: string;
        policy: string;
        success_action_status: string;
        "X-Amz-Algorithm": string;
        "X-Amz-Credential": string;
        "X-Amz-Signature": string;
        "X-Amz-Date": string;
      }
    }
  }

  export interface Bib {
    mms_id: string;
  }

  export interface Representation {
    id: string;
    delivery_url: string;
    files: {
      total_record_count: number,
      link: string
    },
  }
}