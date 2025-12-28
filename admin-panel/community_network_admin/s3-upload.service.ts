/****************************
 Pagename : s3-uploadservice 
 Author :   
 CreatedDate : 20.11.2021
                   
 Purpose : S3-Upload Service Panel
*****************************/
import { Injectable } from '@angular/core';
import { AWSFolder } from '../interfaces/aws-folder.interface';
import { FileSizeSettings } from '../interfaces/file-size-settings.interface';
import { GlobalConstantService } from './global-constant.service';
import { HttpService } from './http.service';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})

/****************************
 Classname : S3UploadService 
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : uploadToS3,getAwsFolders
*****************************/
export class S3UploadService {
  private mBucket:string;
  private mFolder:Array<string>;
  private mFileSize:FileSizeSettings;
  private awsFolders:AWSFolder;
  errors = null;
  constructor(
    private http:HttpService,
    private loader:LoaderService,
    private constant:GlobalConstantService
  ) {
    this.mBucket='';
    this.mFolder=[];
    this.getAwsFolders();
    //console.log("Getting s3service ");
    this.http.setModule('getFileSize').list({}).subscribe(response => {
      //console.log(">>>>>RESPONSE:---->>> ", response);
      this.mFileSize = response.data;
    }, error => {
      //console.log(error);
    })
   }
  
/****************************
 Function name : setFolder
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : Set Folder
 Params: folder
*****************************/     
  public setFolder(folder:Array<string>): void{
    this.mFolder=folder;
  }

/****************************
 Function name : setBucket
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : Set Bucket
 Params: bucket
*****************************/    
  public setBucket(bucket:string): void{
    this.mBucket=bucket;
  }

/****************************
 Function name : getBucket
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : Get Bucket
 Params: 
*****************************/  
  public getBucket(): string{
  return this.mBucket;
  }

/****************************
 Function name : getFolder
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : Get Folder
 Params: 
*****************************/  
  public getFolder(): Array<string>{
    return this.mFolder;
  }

/****************************
 Function name : uploadToS3
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : upload To S3
 Params: vfile,bucket,folder
*****************************/    
  public async uploadToS3(vfile,bucket='',folder:string|Array<string>=[]) {
    if (!vfile) throw new Error("Invalid File");
    // These following variales are used for storing the current video url and then attached to the form element 
    // At the end of the upload.
    let objectUrl = "";
    let object_id = "";
    let partSize = this.constant.FILE_UPLOAD_PART_SIZE * 1024 * 1024; // 50 MIB
    // Getting the file size
    let fileSize = vfile.size;
    let file_type = vfile.type;
    if((new RegExp(/video\/*/)).test(file_type)) {
      // Check for video limit
      if(fileSize > (this.mFileSize.max_video_size * 1024 * 1024)) {
        // Invalid file size
        throw new Error("Video file size exceeded. Allowed max: " + this.mFileSize.max_video_size + " " + this.mFileSize.video_unit);
      }
    } else {
      if(fileSize > (this.mFileSize.max_file_size * 1024 * 1024)) {
        // Invalid file size
        throw new Error("File size exceeded. Allowed max: " + this.mFileSize.max_file_size + " " + this.mFileSize.file_unit);
      }
    }
    // If the folder passed as string to get the key of AWS flder structure object.
    if(typeof folder === 'string') {
      folder = this.awsFolders[folder];
    }
    // For now this if condition is redundant.
    // We are using this function to upload the file as a whole object to the S3 for now.
    // If instructed to uplaod the same as part by part then remove the || true
    if (fileSize <= partSize || true) {
    // FIle is only one part just upload it directly
    // File size is small enough to be uploaded directly.
    // Requesting the pre-signed url from the server to upload the file to amazon.
    let s3Param={ bucket:'',folder_list:undefined, type:""};
    if(!bucket){
      bucket=this.mBucket;
    }
    if(!folder || folder.length===0){
      folder=this.mFolder;
    }
    this.loader.show();
    s3Param.bucket=bucket;
    s3Param.folder_list=JSON.stringify(folder);
    s3Param.type = file_type;
    let res = await this.http.setModule('s3UploadURL').list(s3Param).toPromise();
    let url = res.data.url;
    // Hiting AWS server to upload the file.
    // With the url (AWS Pre-Signed URL)
    await this.http.setModule('putVideoToS3').putObjectS3(url, vfile, file_type).toPromise();
    // console.log(testres);
    this.loader.hide();
    // Caching the url and object_key for future use.
    objectUrl = url.split('?')[0];
    object_id = res.data.Key;
    // return the url and object id
    return { url:objectUrl,object_id:object_id};  
  } else {
    // Now the file is greater than 50 MiB so needs to follow the multipart upload procedure
    // Getting total part count of the file based on the file size.
    // Adding 1 to include the fraction
    const partCount = Math.floor(fileSize / partSize) + 1;
    // This is for the progress bar.
    // Getting how much percentage each part will cover in 100% ratio.
    let percent = 100 / partCount;
    // Now generate a request to the server for create the presigned url, UploadId, Key for the parts
    const partres = await this.http.setModule('coursePartUploadURL').list({ partscount: partCount }).toPromise();
    const preSignedURLS = partres.presignedUrls;
    const UploadId = partres.UploadId;
    const Key = partres.Key;
    object_id = Key;
    // Setting to session storage. incase the upload needs to be aborted.
    // Abortion of upload progress is not implemented yet.
    // May or may not be implemented based on the requirements
    sessionStorage.setItem(this.constant.KEYS.SESSION.UploadId, UploadId);
    sessionStorage.setItem(this.constant.KEYS.SESSION.Key, Key);

    let multipartUploadedInfo = [];
    // Breaking the files in parts and uploading it to S3 Bucket using the presigned url
    // Looping through each part to upload the parts to the S3 Buckeet with the pre-signed urls recieved from Node server
    for (let uploadPartCount = 1; uploadPartCount < (partCount + 1); uploadPartCount++) {
      // The start and end index used for breking the file part.
      let start = (uploadPartCount - 1) * partSize;
      let end = uploadPartCount * partSize;
      // Slicing up the part from the Video file
      const filePart = uploadPartCount < partCount ? vfile.slice(start, end) : vfile.slice(start);

      // If the current part is present in the current Pre-signed url array.
      if (uploadPartCount == preSignedURLS[uploadPartCount - 1].part) {
        // Actual Part is being upload to the S3 storage. Using the secure presigned URL.
        let response = await fetch(preSignedURLS[uploadPartCount - 1].url, {
          method: 'PUT',
          body: filePart
        });
        // The ETag returned from the Amazon S3 server.
        // This is a reference checksum, used in later part in the following module.
        const ETag = response.headers.get('ETag');
        // Creating array of objects to relationized the Etag with the partnumber uploaded for it.
        // This will be used later by The AWS to compressing the file parts into one whole file.
        multipartUploadedInfo.push({
          ETag: ETag,
          PartNumber: uploadPartCount
        });
      }
    }
    // Part upload loop end
    // Requesting to the Node server to notify the AWS that the multiparts are completed.
    // And now the uploaded parts can be joined togather.
    // Params: -> 
    // Parts :=> consist of the Etag with each part
    // Key :=> is the object name.
    // UploadId :=> Created for this upload process.
    const completeMultiPartResponse = await this.http.setModule('coursePartUploadComplete').create({ Parts: multipartUploadedInfo, Key: Key, UploadId: UploadId }).toPromise();
    // After completing the joining process we get a path (URL), By which we can access the uploaded file.
    objectUrl = completeMultiPartResponse.path;
    // Remove the upload if and key from session storage
    sessionStorage.removeItem(this.constant.KEYS.SESSION.UploadId);
    sessionStorage.removeItem(this.constant.KEYS.SESSION.Key);
  }
  //Part Upload codition end
  return {url:objectUrl, object_id:object_id};
  }

/****************************
 Function name : getAwsFolders
 Author :   
 CreatedDate : 15.11.2021
                   
 Purpose : Get Aws Folder
 Params: 
*****************************/     
  getAwsFolders(){
    this.loader.show();
    let param = { };
    this.http.setModule('getAwsFolder').list((param)).subscribe(data => {
      this.loader.hide();
      this.awsFolders = data.data;
    },
    error => {
      this.loader.hide();
    });
  }

  // public xyzFunc(callback, errorcallback) {
  //   // Https
  //   this.http.setModule('').list({type:"course"}).subscribe(callback, errors => {
  //     if(typeof errorcallback === 'function') return errorcallback(errors);
  //   });
  // }
  
}