import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, from, of } from 'rxjs';
import { catchError, map, skipWhile, switchMap, tap } from 'rxjs/operators';
import { Alma } from '../models/alma';
import { AlmaService } from './alma.service';
import { v4 as uuidv4 } from 'uuid';
import CryptoES from 'crypto-es';
import { selectText } from '../utils';

export class UploadFile {
  inProgress: boolean = false;
  data: File;
  progress: number = 0;

  constructor(file: File) {
    this.data = file;
  }
}
/*
  Inspiration from https://efficientcoder.net/angular-tutorial-example-upload-files-with-formdata-httpclient-rxjs-and-material-progressbar/
*/
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private _generalConfig: Alma.GeneralConfig;

  constructor(
    private http: HttpClient,
    private alma: AlmaService,
  ) { }

  upload(files: UploadFile[]) {
    let keys = files.map(file => this.uploadFile(file));
    return forkJoin(keys);
  }

  uploadFile(file: UploadFile) {
    file.inProgress = true;
    let ingest_url: string;
    return this.generalConfig
    .pipe(
      tap(config => ingest_url = config.digital.ingest_url),
      switchMap(config => this.buildForm(file, config)),
      switchMap(form => this.http.request<any>(
        new HttpRequest(
          'POST',
          ingest_url,
          form, 
          {
            reportProgress: true,
            responseType: 'text',
          }
        ))
      ),
      tap(event => {  
        switch (event.type) {  
          case HttpEventType.UploadProgress:  
            file.progress = Math.round(event.loaded * 100 / event.total);  
            break;  
          case HttpEventType.Response:  
            file.inProgress = false;
        }  
      }),
      /* Ignore progress events */
      skipWhile(event => event.type != HttpEventType.Response),
      map(event => this.extractKey(event)),
      catchError((error: HttpErrorResponse) => {  
        file.inProgress = false;  
        console.error(`Upload failed: ${error.message}`);
        throw error;
      }),
    )
  }

  private buildForm(file: UploadFile, config: Alma.GeneralConfig) {
    const formData = new FormData();   
    const key = `${config.institution.value}/upload/export-license/${uuidv4()}/\${filename}`
    Object.entries(config.digital.ingest_form).forEach(([key, val]) => formData.set(key, val));
    formData.set('key', key); 
    formData.set('Content-Type', file.data.type);
    return this.calculateMD5(file)
    .pipe(
      map(result => {
        formData.append('Content-MD5', result);
        /* Must be last */
        formData.append('file', file.data);
        return formData;
      })
    );
  }

  private calculateMD5(file: UploadFile) {
    const promise = new Promise<string>((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = () => {
        try {
          const wordArray = CryptoES.lib.WordArray.create(reader.result as ArrayBuffer);   
          const result = CryptoES.MD5(wordArray).toString(CryptoES.enc.Base64);
          resolve(result);
        } catch (e) {
          console.error('error', e)
          reject(e)
        }
      };
      reader.readAsArrayBuffer(file.data);
    });
    return from(promise);
  }

  private extractKey(event: HttpEvent<any>) {
    let key: string;
    if (event.type == HttpEventType.Response) {
      const doc = new DOMParser().parseFromString((<HttpResponse<any>>event).body, "application/xml");
      key = selectText(doc, `/PostResponse/Key`);
    }
    if (!key) throw new Error('Key could not be extracted.');
    return key;
  }

  get generalConfig() {
    if (this._generalConfig) return of(this._generalConfig);
    return this.alma.getGeneralConfiguration()
    .pipe(tap(config => this._generalConfig = config));
  }
}