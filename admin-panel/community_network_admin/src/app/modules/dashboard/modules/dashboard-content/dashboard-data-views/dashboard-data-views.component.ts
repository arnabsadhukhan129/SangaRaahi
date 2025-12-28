import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// import Chart from 'chart.js/auto';
import {Chart, ChartConfiguration, ChartItem, registerables} from 'node_modules/chart.js';
import {LoaderService} from "../../../../../shared/services/loader.service";
import {ApolloClientService} from "../../../../../shared/services/apollo-client.service";
import {GeneralResponse} from "../../../../../shared/interfaces/general-response.ineterface";
import {AlertService} from "../../../../../shared/services/alert.service";
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard-data-views',
  templateUrl: './dashboard-data-views.component.html',
  styleUrls: ['./dashboard-data-views.component.scss']
})
export class DashboardDataViewsComponent implements OnInit {
  @ViewChild('userchart', {static: true}) private userChartElementRef: ElementRef;
  @ViewChild('communitychart', {static: true}) private communityChartElementRef: ElementRef;
  @ViewChild('groupchart', {static: true}) private groupChartElementRef: ElementRef;
  @ViewChild('eventchart', {static: true}) private eventChartElementRef: ElementRef;
  @ViewChild('messageschart', {static: true}) private messagesChartElementRef: ElementRef;

  userData: Array<String>;
  groupData: Array<String>;
  eventData: Array<String>;
  messageData: Array<String>;
  communityData: Array<String>;

  constructor(
    private loaderService: LoaderService,
    private apolloClient: ApolloClientService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    Chart.register(...registerables);
  }

  public chart :any;

  ngOnInit(): void {
    this.loaderService.show();
    this.apolloClient.setModule('getAdminDashboardDetails').queryData().subscribe((response: GeneralResponse) => {
      this.loaderService.hide();
      if(response.error) {
        this.alertService.error(response.message);
      } else {
        this.userData = response.data.userData;
        this.groupData = response.data.groupData;
        this.eventData = response.data.eventData;
        this.messageData = response.data.messageData;
        this.communityData = response.data.communityData;

         // Destroy previous charts before creating new ones
        this.destroyChart();

        this.createUsaserChart(this.userData);
        this.createCommunityChart(this.communityData);
        this.createGroupChart(this.groupData);
        this.createEventChart(this.eventData);
        this.createMessageChart(this.messageData);
      }
    });

  }

  destroyChart() {
    // Destroy the chart instance if it exists
    if (this.chart) {
      this.chart.destroy();
    }
  }

  createUsaserChart(array: String[]){
    let userContext = this.userChartElementRef.nativeElement;

    this.chart = new Chart(userContext, {
      type: 'bar', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: ['Total Users','Active Users','Inactive Users'],
        datasets: [{
          label: 'Users Data',
          backgroundColor: 'rgb(254,175,66)',
          borderColor: 'rgb(234,234,234)',
          data: array,
        }]
      }

    });
  }

  createCommunityChart(array: String[]){
    let communityContext = this.communityChartElementRef.nativeElement;

    this.chart = new Chart(communityContext, {
      type: 'bar', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: ['Total Community','Active Community','Inactive Community'],
        datasets: [{
          label: 'Communities Data',
          backgroundColor: 'rgb(248,135,51)',
          borderColor: 'rgb(234,234,234)',
          data: array,
        }]
      }

    });
  }

  createGroupChart(array: String[]){
    let groupContext = this.groupChartElementRef.nativeElement;

    this.chart = new Chart(groupContext, {
      type: 'bar', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: ['Total Group','Active Group','Inactive Group'],
        datasets: [{
          label: 'Groups Data',
          backgroundColor: 'rgb(254,175,66)',
          borderColor: 'rgb(234,234,234)',
          data: array,
        }]
      }

    });
  }

  createEventChart(array: String[]){
    let eventContext = this.eventChartElementRef.nativeElement;

    this.chart = new Chart(eventContext, {
      type: 'bar', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: ['Total Event','Active Event','Inactive Event'],
        datasets: [{
          label: 'Events Data',
          backgroundColor: 'rgb(248,135,51)',
          borderColor: 'rgb(234,234,234)',
          data: array,
        }]
      }

    });
  }

  createMessageChart(array: String[]){
    let msgContext = this.messagesChartElementRef.nativeElement;

    this.chart = new Chart(msgContext, {
      type: 'bar', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: ['Total Message','Replied Message','Not-Replied Message'],
        datasets: [{
          label: 'Message Data',
          backgroundColor: 'rgb(254,175,66)',
          borderColor: 'rgb(234,234,234)',
          data: array,
        }]
      }

    });
  }
}
