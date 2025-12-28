import {NgModule} from '@angular/core';
import {ApolloModule, APOLLO_OPTIONS} from 'apollo-angular';
import { ApolloLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import { HttpClientModule } from '@angular/common/http';
import { setContext } from '@apollo/client/link/context';
import {environment} from "../../../environments/environment";

export function createApollo(httpLink: HttpLink) {

  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8'
    }
  }));
  
  const auth = setContext((operation, context) => {
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('loginAccessToken'); // Then check authToken
    }
    if (!token) {
      token = localStorage.getItem('sr_OtpToken'); // Lastly, check sr_OtpToken
    }

    // console.log("token.......",token);
    
    // console.log(operation, "operation......");
    if (token === null) {
      return {};
    } else {
      const contextObject = {
        headers: {
          Authorization: `Sanga-Raahi ${token}`,
          "x-uid":""
        }
      };
      if(operation.operationName && (operation.operationName).toLowerCase() === 'logout') {
        let userData = localStorage.getItem("userData");
        contextObject.headers['x-uid'] = userData ? JSON.parse(userData)['id'] : "";
      }
      return contextObject;
    }
  });

  return {
    link: ApolloLink.from([basic, auth, httpLink.create({uri: environment.API_URL})]),
    cache: new InMemoryCache({ addTypename: false}),
  };
}

@NgModule({
  imports: [
    HttpClientModule,
    ApolloModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
