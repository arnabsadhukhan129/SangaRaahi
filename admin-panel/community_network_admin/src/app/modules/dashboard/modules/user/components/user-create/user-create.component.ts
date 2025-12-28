import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { Router, ActivatedRoute } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
import { CountryCodes } from 'src/app/shared/typedefs/custom.types';
import {map, Observable} from 'rxjs';
// import * as S3 from 'aws-sdk/clients/s3';
import {environment} from "../../../../../../../environments/environment";
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss']
})
export class UserCreateComponent implements OnInit {
  myControl = new UntypedFormControl('');
  createUser: UntypedFormGroup;
  isEdit: String = "Add User";
  flagEdit: Boolean = false;
  maxDate: Date;
  countryCodes: Array<CountryCodes>;
  filteredOptions: Array<CountryCodes>;
  selectedCountryCode: CountryCodes;
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    // private s3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) { 
    this.createUser = new UntypedFormGroup({
      userType: new UntypedFormControl(null, [Validators.required]),
      name: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      email: new UntypedFormControl(null,[Validators.required,Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
      countryCode: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
      phone: new UntypedFormControl(null,[Validators.required,Validators.min(10000000),Validators.max(9999999999999)]),
      address: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace]),
      city: new UntypedFormControl(null,[WhiteSpaceValidator.cannotContainSpace]),
      zipcode: new UntypedFormControl(null),
      dateOfBirth:new UntypedFormControl(null)
    });
  }

  ngOnInit(): void {
    
    if(this.route.snapshot.paramMap.get('id') !== null){
      this.isEdit = "Edit User";
      this.createUser.controls['email'].disable();
      this.createUser.controls['countryCode'].disable();
      this.createUser.controls['phone'].disable();
      this.getUserById();    
    }
    this.createUser.patchValue({
      userType:'user',
    });
    this.maxDate = new Date();
    this.getCountryCodes();

  }
  searchCountry(event:any){
    this._filter(event.target.value)
  }

  private _filter(value: string) {
    const filterValue = value.toLowerCase();

    this.filteredOptions = this.countryCodes.filter(countryCode => countryCode.name.toLowerCase().includes(filterValue));
    if(this.filteredOptions.length == 0){
      this.createUser.controls['countryCode'].reset()
    }
  }

  addCountryCode(country:CountryCodes){
    this.selectedCountryCode = country;
  }

  submit() {

    const userType = this.createUser.controls['userType'].value;
    const name = this.createUser.controls['name'].value;
    const email = this.createUser.controls['email'].value;
    const phone = this.createUser.controls['phone'].value;
    const address = this.createUser.controls['address'].value;
    const city = this.createUser.controls['city'].value;
    const zipcode= this.createUser.controls['zipcode'].value;
    const dateOfBirth= this.createUser.controls['dateOfBirth'].value;
    let dobFormat = dateOfBirth;

    if(dateOfBirth!='' && dateOfBirth!=null)
    {
         dobFormat =  `${dateOfBirth.getFullYear()}-${dateOfBirth.getMonth()+1}-${dateOfBirth.getDate()}`;
    }
    else
    {
         dobFormat = dateOfBirth;
    }
    
    const countryCode= this.selectedCountryCode;
    
    if(countryCode == undefined){
      this.alertService.error('Please select a country code from the list');
    }else if (countryCode.dialCode == undefined ){
      this.alertService.error('Please select a country code from the list');
    }else{
      if(this.route.snapshot.paramMap.get('id') != null) {
        const id = this.route.snapshot.paramMap.get('id');
        const data = {
          data: {
            id:id,
            name: name,
            email: email,
            profileImage:this.image,
            phone: phone.toString(),
            dateOfBirth: dobFormat,
            firstAddressLine: address,
            userType: userType,
            city: city,
            zipcode: zipcode,
            countryCode: countryCode.code,
            phoneCode: countryCode.dialCode
          }
        }
        
        this.loaderService.show();
        this.apolloClient.setModule("updateUser").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          this.loaderService.hide();
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success("User edited successfully.");
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/user');
          }
        });
      }else{
        const data = {
          data: {
            name: name,
            email: email,
            profileImage:this.image,
            phone: phone.toString(),
            dateOfBirth: dateOfBirth,
            firstAddressLine: address,
            userType: userType,
            city: city,
            zipcode: zipcode,
            countryCode: countryCode.code,
            phoneCode: countryCode.dialCode
          }
        }
  
        console.log('create',data);
        this.loaderService.show();
        this.apolloClient.setModule("createUser").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success("User created successfully.");
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/user');
          }
          this.loaderService.hide();
        });
      }
    }
    
    
    
  }
  
  getUserById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getUserByIdId: id
    }
    this.loaderService.show();
    this.apolloClient.setModule('getUserByID').queryData(param).subscribe((response: GeneralResponse) => {
      
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        // this.alertService.success(response.message);
        let date:any = '';
        if(response.data.dateOfBirth && response.data.dateOfBirth.value){
          date = new Date(response.data.dateOfBirth.value);
          date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
        if(response.data.profileImage) {
          this.image = response.data.profileImage;
        }
        this.createUser.patchValue({
          name: response.data.name,
          userType:response.data.userType,
          email:response.data.email,
          phone:response.data.phone,
          dateOfBirth:date,
          address:response.data.firstAddressLine ? response.data.firstAddressLine: '',
          city:response.data.city?response.data.city:'',
          zipcode:response.data.zipcode?response.data.zipcode:'',
          countryCode:response.data.phoneCode ? response.data.phoneCode:''
        });
        this.selectedCountryCode= {
          name:"",
          code:response.data.countryCode,
          dialCode: response.data.phoneCode
        };
      }
    });
  }

  noWhitespaceValidator(control: UntypedFormControl) {
    // const isSpace = (control.value || '').match(/\s/g);
    // return isSpace ? {'whitespace': true} : null;

    if (control.value && control.value.startsWith(' ')) {
      return {
        'whitespace': true
      };
    }
    if (control.value && control.value.endsWith(' ')) {
      return {
        'whitespace': true
      };
    }
  
    return null;
  }

  getCountryCodes() {
    this.loaderService.show();
    this.apolloClient.setModule('getCountryCodes').queryData().subscribe((response: GeneralResponse) => {      
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.countryCodes = response.data;      
        this.filteredOptions = response.data;      
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
    formData.append('type', 'user-profile-image');
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


  numericOnly(event: { which: any; keyCode: any; }): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 101 || charCode == 69 || charCode == 45 || charCode == 43) {
      return false;
    }
    return true;

  }
}
