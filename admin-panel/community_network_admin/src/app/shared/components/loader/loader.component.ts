import { Component, OnInit } from '@angular/core';
import {Subscription} from "rxjs";
import {LoaderService} from "../../services/loader.service";
import {LoaderState} from "../../interfaces/loader-state.interface";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  private loaderSubscription: Subscription;
  show:boolean;
  constructor(private loaderService: LoaderService) { }

  ngOnInit(): void {
    this.loaderSubscription = this.loaderService.loaderState.subscribe((state:LoaderState) => {
      this.show = state.show;
    });
  }

  ngOnDestroy():void {
    if(this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }

}
