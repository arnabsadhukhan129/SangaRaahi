import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private http: HttpClient) { }

  // Convert Blob to ArrayBuffer
  blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return blob.arrayBuffer();
  }

  // Convert ArrayBuffer back to Blob
  arrayBufferToBlob(buffer: ArrayBuffer, type: string = 'image/jpeg'): Blob {
    return new Blob([buffer], { type });
  }

  // Convert ArrayBuffer to File
  arrayBufferToFile(buffer: ArrayBuffer, fileName: string, type: string = 'image/jpeg'): File {
    const blob = this.arrayBufferToBlob(buffer, type);
    return new File([blob], fileName, { type });
  }

  // Convert Blob directly to File
  blobToFile(blob: Blob, fileName: string, type: string = 'image/jpeg'): File {
    return new File([blob], fileName, { type });
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reader.abort();
        reject(new Error("Problem parsing blob to base64"));
      };

      reader.onload = () => {
        resolve(reader.result as string);
      };

      if (!(blob instanceof Blob)) {
        reject(new TypeError("Passed value is not a Blob"));
      } else {
        reader.readAsDataURL(blob);
      }
    });
  }

 sendFile(formData: FormData): Observable<any> {
  // console.log("FormData debug:");
  // Array.from((formData as any).entries() as [string, any][]).forEach(([key, value]) => {
  // console.log(`formData key = ${key}`, value);
  // });
  return this.http.post(environment.uploadImageUrl, formData);
}

  dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

}
