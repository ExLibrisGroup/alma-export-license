import { Injectable } from '@angular/core';
import { CloudAppEventsService, CloudAppRestService, HttpMethod, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { map, switchMap } from 'rxjs/operators';
import { Collection } from '../models/collection';
import { Alma } from '../models/alma';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const STORE_COLLECTION = 'Collection';

@Injectable({
  providedIn: 'root'
})
export class AlmaService {

  constructor(
    private rest: CloudAppRestService,
    private events: CloudAppEventsService,
    private http: HttpClient,
  ) { }

  getCollections() {
    return this.rest.call<Alma.Collections>('/bibs/collections?level=9').pipe(
      map(collections => {
        const conv = (c: Alma.Collection, parent: string = null): Collection => {
          const name = c.name.trim();
          const fullname = (parent && parent.concat('/') || '').concat(name);
          return {
            id: c.pid.value,
            name,
            fullname,
            children: c.collection && c.collection.map(child => conv(child, fullname))
          }
        };
        return collections.collection.map(col => conv(col));
      })
    );
  }

  getLicense(code: string) {
    return this.rest.call<Alma.License>(`/acq/licenses/${code}`)
  }

  createBib(title: string) {
    const requestBody = `
      <bib>
        <suppress_from_publishing>false</suppress_from_publishing>
        <record_format>dc</record_format>
        <record xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>${title}</dc:title>
        </record>
      </bib>
    `
    return this.rest.call<Alma.Bib>({
      url: '/bibs',
      method: HttpMethod.POST,
      headers: { "Content-Type": 'application/xml' },
      requestBody
    })
  }

  addBibToCollection(mmsId: string, collectionId: string) {
    return this.rest.call<Alma.Bib>({
      url: `/bibs/collections/${collectionId}/bibs`,
      method: HttpMethod.POST,
      requestBody: { mms_id: mmsId }
    })
  }

  createRepresentation(mmsId: string) {
    return this.events.getInitData().pipe(
      switchMap(initData => this.rest.call<Alma.Representation>({
        url: `/bibs/${mmsId}/representations`,
        method: HttpMethod.POST,
        requestBody: { 
          library: { value: initData.user.currentlyAtLibCode },
          usage_type: { value: "PRESERVATION_MASTER" }
        }
      })),
    )
  }

  addFileToRepresentation(representation: Alma.Representation, path: string): Observable<Alma.Representation> {
    return this.rest.call({
      url: representation.files.link,
      method: HttpMethod.POST,
      requestBody: { path }
    })
    .pipe(map(() => representation))
  } 

  getGeneralConfiguration() {
    return this.rest.call<Alma.GeneralConfig>('/conf/general')
    .pipe(
      map(config => {
        config.digital.ingest_form = {
          acl: "public-read",
          success_action_status: "201",
          policy: "eyJleHBpcmF0aW9uIjogIjIwMjEtMDctMjBUMDY6NDk6MTZaIiwiY29uZGl0aW9ucyI6IFt7ImJ1Y2tldCI6ICJuYS10ZXN0LXN0MDEuZXh0LmV4bGlicmlzZ3JvdXAuY29tIn0sIFsic3RhcnRzLXdpdGgiLCAiJGtleSIsICJUUl9JTlRFR1JBVElPTl9JTlNUL3VwbG9hZC8iXSx7ImFjbCI6ICJwdWJsaWMtcmVhZCJ9LHsic3VjY2Vzc19hY3Rpb25fc3RhdHVzIjogIjIwMSJ9LFsic3RhcnRzLXdpdGgiLCAiJENvbnRlbnQtTUQ1IiwgIiJdLFsic3RhcnRzLXdpdGgiLCAiJENvbnRlbnQtVHlwZSIsICIiXSx7IngtYW16LWNyZWRlbnRpYWwiOiAiQUtJQUpONk5QTU5HSkFMUFBXQVEvMjAyMTA3MTkvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSx7IngtYW16LWRhdGUiOiAiMjAyMTA3MTlUMDAwMDAwWiIgfV19",
          "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
          "X-Amz-Credential": "AKIAJN6NPMNGJALPPWAQ/20210719/us-east-1/s3/aws4_request",
          "X-Amz-Signature": "1b7d6934b49ccf1c1b2b3d44139a2473363d2c9085dc80d3a839b5fb70b5869b",
          "X-Amz-Date": "20210719T000000Z",
        }
        return config;
      })
    );
  }

  search(q: string) {
    return this.events.getInitData()
    .pipe(
     switchMap(initData => this.http.get<string>(this.buildSearchUrl(q, initData), { responseType: 'text' as 'json'}))
    )
  }

  private buildSearchUrl(q: string, initData: InitData) {
   return `${initData.urls.alma}/view/sru/${initData.instCode}?version=1.2&operation=searchRetrieve&recordSchema=dc&query=${encodeURIComponent(q)}`;
  }
}