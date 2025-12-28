import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { GeneralResponse } from 'src/app/shared/interfaces/general-response.ineterface';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ApolloClientService } from 'src/app/shared/services/apollo-client.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { Community } from 'src/app/shared/typedefs/custom.types';
import { Router , ActivatedRoute} from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
// import * as S3 from 'aws-sdk/clients/s3';
import {environment} from "../../../../../../../environments/environment"
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';

@Component({
  selector: 'app-community-edit',
  templateUrl: './community-edit.component.html',
  styleUrls: ['./community-edit.component.scss']
})
export class CommunityEditComponent implements OnInit {
  updateCommunity: UntypedFormGroup;
  community: Community;
  communityId: String;
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  constructor(
    private loader: LoaderService,
    private apollo: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    // private s3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) { 
    this.updateCommunity = new UntypedFormGroup({
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
      currency: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace])
  });}

  ngOnInit(): void {
    this.getCommunitiesById()
  }

  getCommunitiesById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getCommunityByIdId: id
    }
    this.loader.show();
    this.apollo.setModule('getCommunityByID').queryData(param).subscribe((response: GeneralResponse) => {
      console.log(response.data);
      
      this.loader.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        console.log(response.data,'cpmm')
        this.community = response.data;
        this.communityId = response.data.id;
        if(response.data.nonProfit){
          this.updateCommunity.controls['nonProfitTaxId'].enable();
        }else{
          this.updateCommunity.controls['nonProfitTaxId'].disable();
        }
        if(response.data.bannerImage){
          this.image = response.data.bannerImage;
        }
        this.updateCommunity.patchValue({
          communityType: response.data.communityType,
          communityName:response.data.communityName,
          bannerImage:response.data.bannerImage,
          communityDescription:response.data.communityDescription,
          communityLocation:response.data.communityLocation,
          nonProfit:response.data.nonProfit ? '1':'0',
          nonProfitTaxId:response.data.nonProfitTaxId,
          firstAddressLine:response.data.address && response.data.address.firstAddressLine ? response.data.address.firstAddressLine: '',
          secondAddressLine:response.data.address && response.data.address.secondAddressLine? response.data.address.secondAddressLine: '',
          city:response.data.address && response.data.address.city?response.data.address.city:'',
          state:response.data.address && response.data.address.state?response.data.address.state:'',
          country:response.data.address && response.data.address.country?response.data.address.country:'',
          zipcode:response.data.address && response.data.address.zipcode?response.data.address.zipcode:'',
          currency: response.data.currency && response.data.currency ? response.data.currency : '' 
        })
      }
    });
  }


  /**Using for save currency */
  saveCurrency(ev: any){
    const params: any ={};
    params['data']={
      communityId : this.communityId,
      currency: this.updateCommunity.controls['currency'].value,
    }
    // this.loader.show();
    this.apollo.setModule('editCurrency').mutateData(params).subscribe((response: any) => {
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.alertService.error(response.message);
      }
      // this.loader.hide();
    });
  }

  submit(){
    const id = this.communityId
    const communityType = this.updateCommunity.controls['communityType'].value;
    const communityName = this.updateCommunity.controls['communityName'].value;
    // const bannerImage = this.updateCommunity.controls['bannerImage'].value;
    const communityDescription = this.updateCommunity.controls['communityDescription'].value;
    // const communityLocation = this.updateCommunity.controls['communityLocation'].value;
    const nonProfitTaxId = this.updateCommunity.controls['nonProfitTaxId'].value;
    const nonProfit = this.updateCommunity.controls['nonProfit'].value;
    const city = this.updateCommunity.controls['city'].value;
    const state = this.updateCommunity.controls['state'].value;
    const country = this.updateCommunity.controls['country'].value;
    const zipcode = this.updateCommunity.controls['zipcode'].value;
    const firstAddressLine = this.updateCommunity.controls['firstAddressLine'].value;
    const secondAddressLine = this.updateCommunity.controls['secondAddressLine'].value;

    let nonprofitvalue;
    if(nonProfit == '1') {
      nonprofitvalue = true;
    }else if(nonProfit == '0'){
      nonprofitvalue = false;
    }

    const data = {
      data: {
        id:id,
        communityType: communityType,
        communityName: communityName,
        bannerImage: this.image,
        communityDescription: communityDescription,
        // communityLocation: communityLocation,
        nonProfitTaxId: nonProfitTaxId,
        nonProfit: nonprofitvalue,
        city:city,
        state:state,
        country:country,
        zipcode:zipcode,
        firstAddressLine:firstAddressLine,
        secondAddressLine:secondAddressLine
      }
    }
    
    this.loader.show();
    this.apollo.setModule("updateCommunity").mutateData(data)
    .subscribe((response:GeneralResponse) => {
      if(response.error) {
        // Sow toaster
        this.alertService.error(response.message);
      } else {
        this.alertService.success(response.message);
        // Redirect to the community list.
        this.router.navigateByUrl('dashboard/community');
      }
      this.loader.hide();
    });
  }
  profitIdDisable(disable:boolean){
    if(disable){
      this.updateCommunity.controls['nonProfitTaxId'].disable();
    }else{
      this.updateCommunity.controls['nonProfitTaxId'].enable();
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
    formData.append('type', 'community-edit-image');
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
