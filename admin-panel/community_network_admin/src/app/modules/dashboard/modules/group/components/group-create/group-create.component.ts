import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
// import * as S3 from 'aws-sdk/clients/s3';
import {environment} from "../../../../../../../environments/environment"
import { FileUploadService } from 'src/app/shared/services/file-upload.service';

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.scss']
})
export class GroupCreateComponent implements OnInit {
  createGroup: UntypedFormGroup;
  communities: Array<Community>;
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    // private s3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) {
    this.createGroup = new UntypedFormGroup({
      communityId: new UntypedFormControl(null, [Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      name: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      description: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      groupType: new UntypedFormControl(null,[Validators.required]),
    });
  }

  ngOnInit(): void {
    this.getCommunities();
  }

  submit() {
    const communityId = this.createGroup.controls['communityId'].value;
    const name = this.createGroup.controls['name'].value;
    const description = this.createGroup.controls['description'].value;
    const groupType = this.createGroup.controls['groupType'].value;

    const data = {
      data: {
        communityId: communityId,
        name: name,
        description: description,
        type: groupType,
        image:this.image
      }
    }
    this.loaderService.show();
    this.apolloClient.setModule("createGroup").mutateData(data)
    .subscribe((response:GeneralResponse) => {
      if(response.error) {
        // Sow toaster
        this.alertService.error(response.message);
      } else {
        this.alertService.success("Group created successfully.");
        // Redirect to the group list.
        this.router.navigateByUrl('dashboard/group');
      }
      this.loaderService.hide();
    });
  }

  getCommunities() {
    const params:any = {};
      params['data'] = {
        "isActive": true,
        "isDeleted": false
      }


    this.loaderService.show();
    this.apolloClient.setModule('getMyCommunities').queryData(params).subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.communities = response.data.myCommunities;
      }
    });
  }

  // async onFileSelect(event:any) {
  //   if(event.target.files) {
  //     this.s3UploadService.uploadFile(event.target.files[0]);
  //   }
  // }

  // async uploadFileToS3Bucket(fileName: any) { 
  //   try {
  //     this.image = await this.s3UploadService.uploadFile(fileName);
  //     console.log("File uploaded successfully. Image URL:", this.image);
  //     // Now you can use imageUrl wherever you need it.
  //     } catch (error) {
  //     console.error("Error uploading file:", error);
  //     // Handle error here if needed
  //   }
  // }

  async uploadFileToS3Bucket(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const selectedFile = input.files[0]; // Single file upload (you can extend for multiple)
    const formData = new FormData();
    formData.append('type', 'group-create-image');
    formData.append("images", selectedFile); // Match backend API key

    try {
      // Call your service to send file to backend
      const response = await this.fileUploadService.sendFile(formData).toPromise();

      if (response?.urls[0]) { // Assuming backend returns uploaded file URL
        this.image = response.urls[0];
        console.log("File uploaded successfully. Image URL:", this.image);
      } else {
        console.error("Upload failed or invalid response:", response);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  // uploadFileToS3Bucket(fileName: any) {
  //   const file = fileName.target.files[0];
  //   const files = fileName.target.files;
  //   if (files && file) {
  //     const bucket = new S3(
  //       {
  //         accessKeyId: environment.AWS_ACCESS_KEY,
  //         secretAccessKey: environment.AWS_SECRET_KEY,
  //         region: 'ap-south-1'  //Asia Pacific (Mumbai)
  //       }
  //     );
  
  //       const params = {
  //           Bucket: environment.BUCKET_NAME,
  //           Key: file.name,         
  //           Body: file,
  //           ACL: 'public-read'
  //       };    
  
  //     bucket.upload(params,  (err: any, data: any) => {
  //       if (err) {
  //         console.log('There was an error uploading your file: ', err);
  //         this.alertService.error("There was an error uploading your file");
  //         return false;
  //       }
  
  //       else {
  //         console.log('Successfully uploaded file.', data);
  //         this.alertService.error("Successfully uploaded file.");
  //         this.image = data.Location;
  //         return true;
  //       }
  //     });
  //   }else {
  //     this.alertService.error("No file uploaded.");
  //   }
    
  // }
}
