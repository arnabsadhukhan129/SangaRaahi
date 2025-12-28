import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../shared/services/alert.service";
import { Router, ActivatedRoute } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
import { CountryCodes } from 'src/app/shared/typedefs/custom.types';
import {map, Observable} from 'rxjs';
import {AuthService} from "../../../../../shared/services/auth/auth.service";
import {environment} from "../../../../../../environments/environment"
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
// import * as AWS from 'aws-sdk/global';
// import * as S3 from 'aws-sdk/clients/s3';
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  fileAttr = 'Choose File';
  myControl = new UntypedFormControl('');
  updateUser: UntypedFormGroup;
  isEdit: String = "";
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/blank-profile-picture-973460__340.webp";
  maxDate: Date;
  countryCodes: Array<CountryCodes>;
  filteredOptions: Array<CountryCodes>;
  selectedCountryCode: CountryCodes;
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private authService:AuthService,
    private fileUploadService : FileUploadService
    // private s3UploadService : S3UploadService
  ) { 
    this.updateUser = new UntypedFormGroup({
      imageName: new UntypedFormControl(null),
      name: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      phone: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      email: new UntypedFormControl(null,[Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")])
    });
  }
  ngOnInit(): void {
    this.getMyProfileDetails()
  }

  editProfile() {
    this.isEdit = "Edit"
  }

  editCancel() {
    this.getMyProfileDetails()
    this.isEdit = ""
  }

  getMyProfileDetails() {
    this.loaderService.show();
    this.apolloClient.setModule('getMyProfileDetails').queryData().subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.updateUser.patchValue({
          name: response.data.user.name,
          email:response.data.user.email,
          phone:response.data.user.phone
        })
        this.image = response.data.user.profileImage;
      }
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
  //         this.fileAttr = data.Key;
  //         return true;
  //       }
  //     });
  //   }else {
  //     this.alertService.error("No file uploaded.");
  //     this.fileAttr = 'Choose File';
  //   }
    
  // }

  // async uploadFileToS3Bucket(fileName: any) { 
  //   if(fileName){
  //     try {
  //       this.image = await this.s3UploadService.uploadFile(fileName);
  //       console.log("File uploaded successfully. Image URL:", this.image);
  //       // Now you can use imageUrl wherever you need it.
  //       } catch (error) {
  //       console.error("Error uploading file:", error);
  //       // Handle error here if needed
  //     }
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

  submit(){
    const name = this.updateUser.controls['name'].value;
    const image = this.image;
      const data = {
        data: {
          "name": name,
          "profileImage": image
        }
      }

      this.loaderService.show();
      this.apolloClient.setModule("updateUser").mutateData(data)
      .subscribe((response:GeneralResponse) => {
        if(response.error) {
          // Sow toaster
          this.alertService.error(response.message);
        } else {
          this.alertService.success("Profile updated successfully.");
          // Redirect to the community list.
          this.router.navigateByUrl('dashboard/profile');
        }
        this.loaderService.hide();
      });
  }
}
