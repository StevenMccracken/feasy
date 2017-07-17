import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, Routes, RouterModule } from '@angular/router';

import { LoginComponent } from '../login/login.component';
import { SignupComponent } from '../signup/signup.component';
import { AuthGuard }       from '../router-guard/auth.guard';


const routes: Routes =[
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: '', component: LoginComponent},
  {
    path: 'main',
    loadChildren: '../layout/layout.module#LayoutModule',
    canLoad: [ AuthGuard ]
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  providers: [ AuthGuard ]
})

export class AppRoutingModule{}
