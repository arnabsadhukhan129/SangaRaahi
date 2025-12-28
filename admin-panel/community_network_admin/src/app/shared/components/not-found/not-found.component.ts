import { Component, OnInit } from '@angular/core';
import {ApolloClientService} from '../../services/apollo-client.service'
import {GeneralResponse} from "../../interfaces/general-response.ineterface";
import {User} from "../../typedefs/custom.types";
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
  public users: Array<User>;
  constructor(private apolloClientService:ApolloClientService) { }

  ngOnInit() {
    this.apolloClientService.setModule("getAllUsers").queryData().subscribe((result: GeneralResponse) => {
      console.log(result, "userresult ??");
      this.users = result.data;
    });
    this.apolloClientService.setModule("getAllBooks").queryData().subscribe((result: GeneralResponse) => {
      console.log(result, "booksdata ??");
    });
    this.apolloClientService.setModule("adminLogin").mutateData({
      data: {email:"sangaraahiadmin@mailinator.com",
      password:"admin@123"}
    }).subscribe((result: GeneralResponse) => {
      console.log(result);
    })
  // .subscribe(res =>{
  //     console.log(res);
  //     this.allUser = res;
  // })
  }
  public dashboard = "/dashboard";
}
