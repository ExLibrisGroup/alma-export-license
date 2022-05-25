import { Injectable } from '@angular/core';
import { CloudAppEventsService, CloudAppRestService, HttpMethod, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, defaultIfEmpty, expand, map, switchMap, last, tap } from 'rxjs/operators';
import { Collection } from '../models/collection';
import { Alma, dcTemplate, parseError, parseLicense, sortCodeTable, templateNamespaces } from '../models/alma';
import { EMPTY, forkJoin, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { dom, selectSingleNode } from '../utils';
import { MetadataField } from '../models/settings';

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

  libraryCode: string;
  updated_date: Date;

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
    return this.rest.call<Alma.License>(`/acq/licenses/${code}?include_blank_terms=true`).pipe(tap(license => {
      this.getLicenseAttachments(license.code).subscribe(attachments => {
        this.updated_date = new Date(license.modification_date);
      });
    }))
  }

  getLicenseAttachments(code: string) {
    return this.rest.call<Alma.LicenseAttachments>(`/acq/licenses/${code}/attachments`);
  }

  getLicenseAttachment(url: string) {
    return this.rest.call<Alma.LicenseAttachment>(url + '?expand=content');
  }

  getLicenseTerms() {
    return this.rest.call<Alma.CodeTable>('/conf/code-tables/LicenseTerms')
    .pipe(map(table => sortCodeTable(table)));
  }

  createOrUpdateBibFromLicense(license: Alma.License, mmsId: string, fields: MetadataField[]) {
    const doc = new DOMParser().parseFromString(dcTemplate, "application/xml");
    let record = selectSingleNode(doc, `/bib/record`);
    
    fields.forEach(f => dom(
      f.field, 
      { 
        parent: record, 
        text: f.value == 'TEXT' ? f.text : parseLicense(f.value, license), 
        ns: templateNamespaces[f.field.split(":")[0]] 
      })
    );
    const requestBody = new XMLSerializer().serializeToString(doc.documentElement);
    return this._createOrUpdateBib(mmsId, requestBody);
  }

  private _createOrUpdateBib(mmsId: string, requestBody: string) {
    return this.rest.call<Alma.Bib>({
      url: !mmsId ? '/bibs' : `/bibs/${mmsId}`,
      method: !mmsId ? HttpMethod.POST : HttpMethod.PUT,
      headers: { "Content-Type": 'application/xml' },
      requestBody
    })
  }

  /**
   * Create hierarchy of collections
   */
  createCollectionTree(root: string, path: string[]) {
    path = path.filter(p => !!p);
    let i = 0;
    return this.createCollection(root, path[i])
    .pipe(
      expand(collection => i < path.length - 1 ? this.createCollection(collection.pid.value, path[++i]) : EMPTY),
      last(),
    )
  }

  /**
   * Creates collection, or returns collection if name already exists
   */
  createCollection(parent: string, name: string) {
    return this.getCollection(parent, 2)
    .pipe(
      switchMap(collection => {
        this.libraryCode = collection.library.value;
        const existingCollection = collection.collection && collection.collection.find(c => c.name == name);
        return !!existingCollection ? of(existingCollection) : this._createCollection(parent, name);
      })
    )
  }

  private _createCollection(parent: string, name: string) {
    return this.events.getInitData()
    .pipe(
      map(initData => {
        const requestBody: Alma.Collection = {
          pid: null,
          parent_pid: { value: parent },
          name,
          library: { value: this.libraryCode },
        }
        return {
          method: HttpMethod.POST,
          requestBody,
          url: '/bibs/collections'
        }    
      }),
      switchMap(request => this.rest.call<Alma.Collection>(request)),
    )
  }

  getCollection(pid: string, level: number = 1) {
    return this.rest.call<Alma.Collection>(`/bibs/collections/${pid}?level=${level}`);
  }

  addBibToCollection(mmsId: string, collectionId: string): Observable<Alma.Bib> {
    return this.rest.call<Alma.Bib>({
      url: `/bibs/collections/${collectionId}/bibs`,
      method: HttpMethod.POST,
      requestBody: { mms_id: mmsId }
    })
    .pipe(
      catchError(err => {
        const error = parseError(err);
        return (error && error.errorCode == '701115') /* Already in collection */
          ? of({ mms_id: mmsId })
          : throwError(err);
      })
    )
  }

  createRepresentation(mmsId: string) {
    return this.deleteRepresentations(mmsId)
    .pipe(
      switchMap(() => this.events.getInitData()),
      switchMap(initData => this.rest.call<Alma.Representation>({
        url: `/bibs/${mmsId}/representations`,
        method: HttpMethod.POST,
        requestBody: { 
          library: { value: this.libraryCode },
          usage_type: { value: "PRESERVATION_MASTER" },
          public_note: this.updated_date.toLocaleDateString()
        }
      })),
    )
  }

  deleteRepresentations(mmsId: string) {
    return this.rest.call<Alma.Representations>(`/bibs/${mmsId}/representations`)
    .pipe(
      map(representations => 
        (representations.representation || [])
        .map(r => this.rest.call({
          url: r.link,
          method: HttpMethod.DELETE,
          queryParams: { override: true }
        }))
      ),
      switchMap(requests => forkJoin(requests).pipe(defaultIfEmpty([]))),
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
    return this.rest.call<Alma.GeneralConfig>('/conf/general?expand=ingest_form')
  }

  search(q: string) {
    return this.events.getInitData()
    .pipe(
     switchMap(initData => this.http.get<string>(this.buildSearchUrl(q, initData), { responseType: 'text' as 'json'}))
    )
  }

  private buildSearchUrl(q: string, initData: InitData) {
   return `${initData.urls.alma}view/sru/${initData.instCode}?version=1.2&operation=searchRetrieve&recordSchema=dc&query=${encodeURIComponent(q)}`;
  }
}