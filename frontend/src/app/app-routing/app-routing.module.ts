// Import angular packages
import {
  Router,
  Routes,
  RouterModule,
} from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import our files
import { AuthGuard } from '../router-guard/auth.guard';
import { LoginComponent } from '../login/login.component';
import { SignupComponent } from '../signup/signup.component';
import { PasswordResetComponent } from '../password-reset/password-reset.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'passwordreset',
    component: PasswordResetComponent,
  },
  {
    path: 'main',
    canLoad: [AuthGuard],
    loadChildren: '../layout/layout.module#LayoutModule',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
