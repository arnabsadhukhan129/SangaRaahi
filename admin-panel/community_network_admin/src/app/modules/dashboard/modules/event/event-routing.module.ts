import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventComponent } from './components/event/event.component';
import { EventViewComponent } from './components/event-view/event-view.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
const routes: Routes = [
  {
    path:'',
    component:EventComponent
  },
  {
    path:'view/:id',
    component:EventViewComponent
  },
  {
    path:'create',
    component:CreateEventComponent
  },
  {
    path:'edit/:id',
    component:CreateEventComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventRoutingModule { }
