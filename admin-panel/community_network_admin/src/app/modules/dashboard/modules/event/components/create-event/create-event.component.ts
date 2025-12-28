import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import {LoaderService} from "../../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../../shared/services/alert.service";
import { Router, ActivatedRoute } from '@angular/router';
import { WhiteSpaceValidator } from 'src/app/shared/validator/whiteSpace.validator';
import {map, Observable} from 'rxjs';
import { Community } from 'src/app/shared/typedefs/custom.types';
// import * as S3 from 'aws-sdk/clients/s3';
// import { S3Client, PutObjectCommand,ObjectCannedACL } from '@aws-sdk/client-s3';
import {environment} from "../../../../../../../environments/environment"
// import { S3UploadService } from 'src/app/shared/services/s3-upload.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit {
  myControl = new UntypedFormControl('');
  createEvent: UntypedFormGroup;
  isEdit: String = "Add Event";
  minFromDate: Date;
  minToDate: Date;
  minRSVPDate: Date;
  communities: Array<Community>;
  image: String = "https://sangaraahi.s3.ap-south-1.amazonaws.com/No_Image_Available.jpg";
  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    // private S3UploadService : S3UploadService,
    private fileUploadService : FileUploadService
  ) { 
    //edit form
    if(this.route.snapshot.paramMap.get('id') !== null){
      this.createEvent = new UntypedFormGroup({
        communityId: new UntypedFormControl(null, [Validators.required]),
        type: new UntypedFormControl(null, [Validators.required]),
        title: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        description: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        firstAddressLine: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        city: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        state: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        country: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        zipcode: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        phone: new UntypedFormControl(null,[Validators.required,Validators.min(10000000),Validators.max(9999999999999)]),
        fromDate:new UntypedFormControl(null),
        toDate:new UntypedFormControl(null),
        fromTime:new UntypedFormControl(null),
        toTime:new UntypedFormControl(null),
        invitationType:new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        rsvpEndTime:new UntypedFormControl(null),
        restrictNumberAttendees: new UntypedFormControl(null),
        postEventAsCommunity: new UntypedFormControl(null),
        attendeeListVisibilty: new UntypedFormControl(null),
        collectEventPhotos: new UntypedFormControl(null),
        numberOfMaxAttendees: new UntypedFormControl(null)
      });
    } else {
      //create form
      this.createEvent = new UntypedFormGroup({
        communityId: new UntypedFormControl(null, [Validators.required]),
        type: new UntypedFormControl(null, [Validators.required]),
        title: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        description: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        firstAddressLine: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        city: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        state: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        country: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        zipcode: new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        phone: new UntypedFormControl(null,[Validators.required,Validators.min(10000000),Validators.max(9999999999999)]),
        fromDate:new UntypedFormControl(null,[Validators.required]),
        toDate:new UntypedFormControl(null,[Validators.required]),
        fromTime:new UntypedFormControl(null,[Validators.required]),
        toTime:new UntypedFormControl(null,[Validators.required]),
        invitationType:new UntypedFormControl(null,[Validators.required,WhiteSpaceValidator.cannotContainSpace]),
        rsvpEndTime:new UntypedFormControl(null,[Validators.required]),
        restrictNumberAttendees: new UntypedFormControl(null),
        postEventAsCommunity: new UntypedFormControl(null),
        attendeeListVisibilty: new UntypedFormControl(null),
        collectEventPhotos: new UntypedFormControl(null),
        numberOfMaxAttendees: new UntypedFormControl(null)
      });
    }
    
  }

  ngOnInit(): void {
    if(this.route.snapshot.paramMap.get('id') !== null){
      this.createEvent.controls['communityId'].disable();
      this.createEvent.controls['invitationType'].disable();
      this.isEdit = "Edit Event";
      this.getEventById();    
    }else{
      this.createEvent.controls['numberOfMaxAttendees'].disable();
      this.minFromDate= new Date();
      this.minToDate= new Date();
      this.minRSVPDate= new Date();
    }
    this.getCommunities();
    
  }
  
  click() {
    const userType = this.createEvent.controls['fromTime'].value;
    console.log(userType)
  }
  

  submit() {
    const communityId = this.createEvent.controls['communityId'].value;
    const type = this.createEvent.controls['type'].value;
    const title = this.createEvent.controls['title'].value;
    const description = this.createEvent.controls['description'].value;
    const firstAddressLine = this.createEvent.controls['firstAddressLine'].value;
    const state = this.createEvent.controls['state'].value;
    const country = this.createEvent.controls['country'].value;
    const fromDate = this.createEvent.controls['fromDate'].value
    const toDate = this.createEvent.controls['toDate'].value
    const fromTime = this.createEvent.controls['fromTime'].value
    const toTime = this.createEvent.controls['toTime'].value
    const invitationType = this.createEvent.controls['invitationType'].value;
    const rsvpEndTime = this.createEvent.controls['rsvpEndTime'].value
    const restrictNumberAttendees = this.createEvent.controls['restrictNumberAttendees'].value
    const postEventAsCommunity = this.createEvent.controls['postEventAsCommunity'].value
    const attendeeListVisibilty = this.createEvent.controls['attendeeListVisibilty'].value
    const collectEventPhotos = this.createEvent.controls['collectEventPhotos'].value
    const numberOfMaxAttendees = this.createEvent.controls['numberOfMaxAttendees'].value; 
    const phone = this.createEvent.controls['phone'].value;
    const city = this.createEvent.controls['city'].value;
    const zipcode= this.createEvent.controls['zipcode'].value;
    const fromDateFormat = `${fromDate.getFullYear()}-${fromDate.getMonth()+1}-${fromDate.getDate()}`;
    const toDateFormat = `${toDate.getFullYear()}-${toDate.getMonth()+1}-${toDate.getDate()}`;
      if(this.route.snapshot.paramMap.get('id') !== null) {
        const id = this.route.snapshot.paramMap.get('id');
        const data = {
          data: {
            id: id,
            type: type,
            title: title,
            description: description,
            image: this.image,
            venueDetails: {
              firstAddressLine: firstAddressLine,
              city: city,
              state: state,
              country: country,
              zipcode: zipcode,
              phoneNo: phone.toString()
            },
            date: {
              from: fromDateFormat,
              to: toDateFormat
            },
            time: {
              from: fromTime,
              to: toTime
            },
            rsvpEndTime: rsvpEndTime,
            restrictNumberAttendees: restrictNumberAttendees,
            postEventAsCommunity: postEventAsCommunity,
            attendeeListVisibilty: attendeeListVisibilty,
            collectEventPhotos: collectEventPhotos,
            numberOfMaxAttendees: numberOfMaxAttendees
          }
        }
        
        this.loaderService.show();
        this.apolloClient.setModule("updateEvent").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          this.loaderService.hide();
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/event');
          }
        });
      }else{
        const data = {
          data: {
            communityId: communityId,
            type: type,
            title: title,
            description: description,
            image: this.image,
            venueDetails: {
              firstAddressLine: firstAddressLine,
              city: city,
              state: state,
              country: country,
              zipcode: zipcode,
              phoneNo: phone.toString()
            },
            date: {
              from: fromDateFormat,
              to: toDateFormat
            },
            time: {
              from: fromTime,
              to: toTime
            },
            invitationType: invitationType,
            rsvpEndTime: rsvpEndTime,
            restrictNumberAttendees: restrictNumberAttendees ? true : false,
            postEventAsCommunity: postEventAsCommunity ? true : false,
            attendeeListVisibilty: attendeeListVisibilty ? true : false,
            collectEventPhotos: collectEventPhotos ? true : false,
            numberOfMaxAttendees: numberOfMaxAttendees
          }
        }
        
  
        this.loaderService.show();
        this.apolloClient.setModule("createEvent").mutateData(data)
        .subscribe((response:GeneralResponse) => {
          if(response.error) {
            // Sow toaster
            this.alertService.error(response.message);
          } else {
            this.alertService.success(response.message);
            // Redirect to the user list.
            this.router.navigateByUrl('dashboard/event');
          }
          this.loaderService.hide();
        });
      }
    }
    

  getEventById() {
    const id = this.route.snapshot.paramMap.get('id');
    const param = {
      getAdminEventByIdId: id
    }
    this.loaderService.show();
    this.apolloClient.setModule('getAdminEventByID').queryData(param).subscribe((response: GeneralResponse) => {
      
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        const data = response.data;
        let fromDate:any = '';
        if(data.date && data.date.from){
          fromDate = new Date(data.date.from);
          fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
          
        }
        
        let toDate:any = '';
        if(data.date && data.date.to){
          toDate = new Date(data.date.to);
          toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        }

        let fromTime:any = '';
        if(data.time && data.time.from){
          fromTime = new Date(data.time.from);
          if(fromTime < new Date()) {
            this.createEvent.controls['fromDate'].disable();
            this.createEvent.controls['fromTime'].disable();
            this.createEvent.controls['rsvpEndTime'].disable();
            this.minFromDate = fromTime;
            this.minToDate = fromTime;
          }else{
            this.minFromDate = new Date();
            this.minToDate = new Date();
          }
          
          fromTime = (fromTime.getUTCHours())+':'+(fromTime.getUTCMinutes());
        }

        let toTime:any = '';
        if(data.time && data.time.to){
          toTime = new Date(data.time.to);
          toTime = (toTime.getUTCHours())+':'+(toTime.getUTCMinutes());
        }

        
        let rsvpEndTime:any = '';
        if(data.rsvpEndTime){
          rsvpEndTime = new Date(data.rsvpEndTime);
          rsvpEndTime = new Date(rsvpEndTime.getFullYear(), rsvpEndTime.getMonth(), rsvpEndTime.getDate());
          if(rsvpEndTime < new Date()) {
            this.minRSVPDate = rsvpEndTime;
          }else{
            this.minRSVPDate = new Date();
          }
          
        }
        if(data.image) {
          this.image = data.image;
        }
        
        
        this.createEvent.patchValue({
          name: data.name,
          communityId: data.communityId,
          type:  data.type,
          title: data.title,
          description: data.description,
          firstAddressLine: data.venueDetails.firstAddressLine,
          city: data.venueDetails.city,
          state: data.venueDetails.state,
          country: data.venueDetails.country,
          zipcode: data.venueDetails.zipcode,
          phone: data.venueDetails.phoneNo,
          //
          fromDate:fromDate,
          toDate:toDate,
          fromTime:fromTime,
          toTime:toTime,
          //
          invitationType:data.invitationType,
          //
          rsvpEndTime:rsvpEndTime,
          //
          restrictNumberAttendees: data.attendees.isRestricted,
          postEventAsCommunity: data.postEventAsCommunity,
          attendeeListVisibilty: data.attendees.attendeesListVisibility === "Host" ? true : false,
          collectEventPhotos: data.attendees.mediaUploadByAttendees,
          numberOfMaxAttendees:data.attendees.numberOfMaxAttendees
        });
      }
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
        this.communities = response.data.myCommunities;
      }
    });
  }

  noWhitespaceValidator(control: UntypedFormControl) {
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

  // uploadFileToS3Bucket(fileName: any) {
  //   const file = fileName.target.files[0];
  //   const files = fileName.target.files;
  //   if (files && file) {
  //     const bucket = new S3Client(
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
  //       this.image = await this.S3UploadService.uploadFile(fileName);
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

  numericOnly(event: { which: any; keyCode: any; }): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 101 || charCode == 69 || charCode == 45 || charCode == 43) {
      return false;
    }
    return true;

  }

  restrictAtendees() {
    const isRestrict = this.createEvent.controls['restrictNumberAttendees'].value;
    if(isRestrict) {
      this.createEvent.controls['numberOfMaxAttendees'].enable();
    }else{
      this.createEvent.controls['numberOfMaxAttendees'].disable();
    }
  }
}
