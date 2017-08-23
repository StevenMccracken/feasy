import 'hammerjs';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClientConfig, GoogleApiModule, NG_GAPI_CONFIG } from 'ng-gapi';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AuthGuard } from './router-guard/auth.guard';
import { UserService } from './services/user.service';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { LayoutComponent } from './layout/layout.component';
import { AssignmentService } from './services/assignment.service';
import { AppRoutingModule } from './app-routing/app-routing.module';

// Configure client side Google API service
let gapiClientConfig: ClientConfig = {
  clientId: '442519493070-6g7gli3v0rr2cr8m7r122m677ce2i645.apps.googleusercontent.com',
  discoveryDocs: [],
  scope: [
    'email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/calendar'
  ].join(' '),
  redirect_uri: 'https://api.feasy-app.com/auth/google/exchange',
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
  ],
  imports: [
    HttpModule,
    FormsModule,
    BrowserModule,
    MaterialModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    GoogleApiModule.forRoot({
      provide: NG_GAPI_CONFIG,
      useValue: gapiClientConfig
    }),
  ],
  providers: [
    AuthGuard,
    UserService,
    AssignmentService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
