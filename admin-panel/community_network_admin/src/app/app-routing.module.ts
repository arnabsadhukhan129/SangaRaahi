import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { PrivacyPolicyComponent } from './shared/components/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './shared/components/terms-conditions/terms-conditions.component'
import { ComingSoonComponent } from './shared/components/coming-soon/coming-soon.component';

const routes: Routes = [
  { path:'auth', loadChildren: () => import('./modules/auth/auth.module').then(module => module.AuthModule)},
  { path:'dashboard', loadChildren: () => import('./modules/dashboard/dashboard.module').then(module => module.DashboardModule)},
  { path: 'privacy-policy', component: PrivacyPolicyComponent},
  { path: 'terms-conditions', component: TermsConditionsComponent},
  { path: '', redirectTo:'dashboard', pathMatch: 'full'},
  { path: '**', component: NotFoundComponent, pathMatch: 'full'},
  { path: 'no', component: NotFoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule, MatCardModule]
})
export class AppRoutingModule { }
