import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { Router } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
// import * as S3 from 'aws-sdk/clients/s3';
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
import {environment} from "../../../../../../../environments/environment"
import { FileUploadService } from 'src/app/shared/services/file-upload.service';


@Component({
  selector: 'app-community-create',
  templateUrl: './community-create.component.html',
  styleUrls: ['./community-create.component.scss']
})
export class CommunityCreateComponent implements OnInit {
  createCommunity: UntypedFormGroup;
  bannerImage: File ;
  nonprofitvalue: boolean = false;
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    // private s3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) { 
    this.createCommunity = new UntypedFormGroup({
      communityType: new UntypedFormControl(null, [Validators.required]),
      communityName: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      // bannerImage: new FormControl(null,[Validators.required]),
      communityDescription: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      // communityLocation: new FormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      nonProfit: new UntypedFormControl(null,[Validators.required]),
      nonProfitTaxId: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace]),
      firstAddressLine: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      secondAddressLine: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace]),
      city: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      state: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      country: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      zipcode: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace]),
    });
  }

  ngOnInit(): void {
  }

  async submit(){
    const communityType = this.createCommunity.controls['communityType'].value;
    const communityName = this.createCommunity.controls['communityName'].value;
    const communityDescription = this.createCommunity.controls['communityDescription'].value;
    // const communityLocation = this.createCommunity.controls['communityLocation'].value;
    const nonProfitTaxId = this.createCommunity.controls['nonProfitTaxId'].value;
    const nonProfit = this.createCommunity.controls['nonProfit'].value;
    const city =this.createCommunity.controls['city'].value;
    const state =this.createCommunity.controls['state'].value;
    const country =this.createCommunity.controls['country'].value;
    const zipcode =this.createCommunity.controls['zipcode'].value;
    const firstAddressLine =this.createCommunity.controls['firstAddressLine'].value;
    const secondAddressLine =this.createCommunity.controls['secondAddressLine'].value
    if(nonProfit == '1') {
      this.nonprofitvalue = true;
    }else if(nonProfit == '0'){
      this.nonprofitvalue = false;
    }
    
    //S3 Image upload
    // let bannerUrl = this.s3UploadService.uploadToS3(this.bannerImage).subscribe(result => {
    //   console.log(result,'ghhghgh');
      
      const data = {
        data: {
          communityType: communityType,
          communityName: communityName,
          bannerImage: this.image,
          communityDescription: communityDescription,
          // communityLocation: communityLocation,
          nonProfitTaxId: nonProfitTaxId,
          nonProfit: this.nonprofitvalue,
          city:city,
          state:state,
          country:country,
          zipcode:zipcode,
          firstAddressLine:firstAddressLine,
          secondAddressLine:secondAddressLine
        }
      }

      this.loaderService.show();
      this.apolloClient.setModule("createCommunity").mutateData(data)
      .subscribe((response:GeneralResponse) => {
        if(response.error) {
          // Sow toaster
          this.alertService.error(response.message);
        } else {
          this.alertService.success(response.message);
          // Redirect to the community list.
          this.router.navigateByUrl('dashboard/community');
        }
        this.loaderService.hide();
      });

    // }, error => {
      
    // });
    
    
  }

  fileChangeEvent(e: any){
    // const fileData: FileList = e.target.files;
    this.bannerImage = e.target.files;
    // this.bannerImage = fileData.item(0);
  }

  profitIdDisable(disable:boolean){
    if(disable){
      this.createCommunity.controls['nonProfitTaxId'].disable();
    }else{
      this.createCommunity.controls['nonProfitTaxId'].enable();
    }
    
  }

  async uploadFileToS3Bucket(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const selectedFile = input.files[0]; // Single file upload (you can extend for multiple)
    const formData = new FormData();
    formData.append('type', 'community-image');
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
