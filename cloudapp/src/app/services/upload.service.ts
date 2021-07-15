import { HttpClient, HttpErrorResponse, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Alma } from '../models/alma';
import { AlmaService } from './alma.service';
import { v4 as uuidv4 } from 'uuid';
import CryptoES from 'crypto-es';
import { selectSingleNode } from '../utils';

export interface UploadFile {
  inProgress: boolean;
  data: File;
  progress: number;
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

  upload(file: UploadFile) {
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
      map(event => {  
        switch (event.type) {  
          case HttpEventType.UploadProgress:  
            file.progress = Math.round(event.loaded * 100 / event.total);  
            break;  
          case HttpEventType.Response:  
            try {
              file.inProgress = false;
              const doc = new DOMParser().parseFromString(event.body, "application/xml");
              let key = selectSingleNode(doc, `/PostResponse/Key`);
              return key;
            } catch(e) {
              console.error('Error extracting key', e)
              return '';
            }
        }  
      }),  
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
    formData.append('key', key); 
    formData.append('Content-Type', file.data.type);
    Object.entries(config.digital.ingest_form).forEach(([key, val]) => formData.append(key, val))
    return from(this.calculateMD5(file)).pipe(
      map(result => {
        formData.append('Content-MD5', result);
        /* Must be last */
        formData.append('file', file.data);
        return formData;
      })
    );
  }

  private calculateMD5(file: UploadFile): Promise<string> {
    return new Promise((resolve, reject) => {
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
    })
  }

  get generalConfig() {
    if (this._generalConfig) return of(this._generalConfig);
    return this.alma.getGeneralConfiguration()
    .pipe(tap(config => this._generalConfig = config));
  }
}