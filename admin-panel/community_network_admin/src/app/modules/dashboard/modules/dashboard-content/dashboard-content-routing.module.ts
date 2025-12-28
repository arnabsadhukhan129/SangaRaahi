import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardDataViewsComponent } from './dashboard-data-views/dashboard-data-views.component'

const routes: Routes = [
    {
        path:'',
        component:DashboardDataViewsComponent
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class DashboardContentRoutigModule { }