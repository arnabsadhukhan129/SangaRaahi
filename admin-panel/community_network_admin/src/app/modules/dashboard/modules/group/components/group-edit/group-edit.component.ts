import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community , Group } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
// import * as S3 from 'aws-sdk/clients/s3';
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
import {environment} from "../../../../../../../environments/environment"
import { FileUploadService } from 'src/app/shared/services/file-upload.service';


@Component({
  selector: 'app-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: ['./group-edit.component.scss']
})
export class GroupEditComponent implements OnInit {
  updateGroup: UntypedFormGroup;
  group: Group;
  groupId: String;
  communities: Array<Community>;
  image: any = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    // private s3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) { 
    this.updateGroup = new UntypedFormGroup({
    communityId: new UntypedFormControl(null, [Validators.required,WhiteSpaceValidator.cannotContainSpace]),
    name: new UntypedFormControl(null, [Validators.required,WhiteSpaceValidator.cannotContainSpace]),
    description: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace])
  });}

  ngOnInit(): void {
    this.getCommunities();
    this.getGroupById();
  }

  getGroupById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAdminGroupByIdId: id
    }
    
    this.loader.show();
    this.apollo.setModule('getAdminGroupByID').queryData(param).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.group = response.data;
        this.groupId = response.data.id;
        if(response.data.image) {
          this.image = response.data.image;
        }
        this.updateGroup.patchValue({
          communityId: response.data.communityId,
          name: response.data.name,
          description:response.data.description,
          
        })
      }
    });
  }

  getCommunities() {
    const params:any = {};
      params['data'] = {
        "isActive": true,
        "isDeleted": false
      }
    
    
    this.loader.show();
    this.apollo.setModule('getMyCommunities').queryData(params).subscribe((response: GeneralResponse) => {
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        this.communities = response.data.myCommunities;
      }
    });
  }


  submit(){
    const id = this.groupId
    const name = this.updateGroup.controls['name'].value;
    const description = this.updateGroup.controls['description'].value;
    const communityId = this.updateGroup.controls['communityId'].value;
    const data = {
      updateGroupId: id,
      data: {
        name: name,
        description: description,
        communityId: communityId,
        image:this.image
      }
    }
    this.loader.show();
    this.apollo.setModule("updateGroup").mutateData(data)
    .subscribe((response:GeneralResponse) => {
      if(response.error) {
        // Sow toaster
        this.alertService.error(response.message);
      } else {
        this.alertService.success(response.message);
        // Redirect to the group list.
        this.router.navigateByUrl('dashboard/group');
      }
      this.loader.hide();
    });
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
    formData.append('type', 'group-edit-image');
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
}
