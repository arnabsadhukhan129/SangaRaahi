// import { Injectable } from '@angular/core';
// import {ApolloClientService} from "./apollo-client.service";
// import {LoaderService} from "./loader.service";
// import {GeneralResponse} from "../interfaces/general-response.ineterface";
// import { Observable } from 'rxjs';
// import {HttpClient, HttpHeaders} from "@angular/common/http";
// import {tap} from "rxjs/operators";
// // import * as AWS from 'aws-sdk/global';
// // import * as S3 from 'aws-sdk/clients/s3';
// import {environment} from "../../../environments/environment";
// import * as CryptoJS from 'crypto-js';
// import { S3Client, PutObjectCommand,ObjectCannedACL } from '@aws-sdk/client-s3';
// import { AlertService } from './alert.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class S3UploadService {
//   private mBucket:string;
//   private mFolder:Array<string>;
//   image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
//   constructor(
//     private apolloClient: ApolloClientService,
//     private loaderService: LoaderService,
//     private http: HttpClient,
//     private alertService: AlertService,
//   ) { }
// //   uploadFile(file:File, folder=[]) {
// //     const objectname = CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Hex);
// //     const contentType = file.type;
// //     let extension='';
// //     if (contentType && contentType !== "") {
// //       extension = contentType.split("/")[1];
// //       if (extension === "svg+xml") extension = "svg";
// //       extension = "." + extension;
// //     }
// //     const bucket = new S3(
// //       {
// //         accessKeyId: environment.AWS_ACCESS_KEY,
// //         secretAccessKey: environment.AWS_SECRET_KEY,
// //         region: environment.AWS_REGION
// //       }
// //     );
// //     const params = {
// //       Bucket: environment.BUCKET_NAME,
// //       Key: `${objectname}.${extension}`,
// //       Body: file,
// //       ACL: 'public-read',
// //       ContentType: contentType
// //     };
// //     bucket.upload(params, function (err:any, data:any) {
// //       if (err) {
// //         console.log('There was an error uploading your file: ', err);
// //         return false;
// //       }
// //       console.log('Successfully uploaded file.', data);
// //       return true;
// //     });
// // //for upload progress
// //     /*bucket.upload(params).on('httpUploadProgress', function (evt) {
// //               console.log(evt.loaded + ' of ' + evt.total + ' Bytes');
// //           }).send(function (err, data) {
// //               if (err) {
// //                   console.log('There was an error uploading your file: ', err);
// //                   return false;
// //               }
// //               console.log('Successfully uploaded file.', data);
// //               return true;
// //           });*/
// //   }
//   public uploadToS3(vfile:any,bucket='',folder:string|Array<string>=[]):Observable<any> {
//     return new Observable((observe) => {
//       console.log(vfile)
//       if (!vfile) observe.error("Provide a valid file");
//       let objectUrl = "";
//       let object_id = "";
//       // let fileSize = vfile.size;
//       let file_type = vfile[0].type;
//       // if(typeof folder === 'string') {
//       //   folder = this.awsFolders[folder];
//       // }
//       let s3Param={
//         data : {
//           bucket:'',
//           folderList:[],
//           type:""
//         }
//       };
//       if(!bucket){
//         bucket="sangaraahi";
//       }
//       // if(!folder || folder.length===0){
//       //   folder=this.mFolder;
//       // }

//       this.loaderService.show();
//       s3Param.data.bucket=bucket;
//       // s3Param.folder_list=JSON.stringify(folder);
//       s3Param.data.type = file_type;
//       console.log(s3Param);
//       this.apolloClient.setModule('generateS3UploadURL').mutateData(s3Param).subscribe(async (res:GeneralResponse) => {
//         // The main S3 presigned URL for to upload the file to S3
//         let url = res.data.url;
//         this.loaderService.hide();
//         // Uploading the file to S3 server
//         const uploadResponse = await this.http.put<any>(url, {
//           headers: new HttpHeaders({
//             "Content-Type":file_type
//           }),
//           reportProgress:true,
//           observe:'events'
//         }).pipe(
//           tap((data:any) => {
//             return data;
//           })
//         ).toPromise();
//         // const uploadResponse = await fetch(url, {
//         //   method:'PUT',
//         //   body: vfile[0],
//         //   headers:{
//         //     "Content-Type":file_type
//         //   }
//         // });

//         objectUrl = url.split('?')[0];
//         object_id = res.data.Key;
//         observe.next({url:objectUrl, key:object_id});
//       }, error => {
//         observe.error(error);
//       });
//     })
//   }

//   /**File upload in s3 bucket */
//   async uploadFile(fileName: any): Promise<any> {
//     const file = fileName.target.files[0];
//     const files = fileName.target.files;
    
//     if (files && file) {
//         const config = {
//             credentials: {
//                 accessKeyId: environment.AWS_ACCESS_KEY,
//                 secretAccessKey: environment.AWS_SECRET_KEY
//             },
//             region: 'ap-south-1' // Asia Pacific (Mumbai)
//         };

//         const s3Client = new S3Client(config);

//         const params = {
//             Bucket: environment.BUCKET_NAME,
//             Key: file.name,         
//             Body: file,
//             ACL: ObjectCannedACL.public_read // Or you can remove this line if you don't need to specify ACL
//         };    

//         try {
//             const command = new PutObjectCommand(params);
//             await s3Client.send(command);
//             console.log('Successfully uploaded file.');
//             this.alertService.success("Successfully uploaded file.");
//             this.image = `https://${environment.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${file.name}`;
//             return this.image;
//         } catch (err) {
//             console.log('There was an error uploading your file: ', err);
//             this.alertService.error("There was an error uploading your file");
//             return false;
//         }
//     } else {
//         this.alertService.error("No file uploaded.");
//         return false;
//     }
//   }
// }
