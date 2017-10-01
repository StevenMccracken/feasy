// Import angular packages
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Import 3rd-party libraries
import {
  ClientConfig,
  NG_GAPI_CONFIG,
  GoogleApiModule,
} from 'ng-gapi';
import 'hammerjs';

// Import our files
import { AppComponent } from './app.component';
import { AuthGuard } from './router-guard/auth.guard';
import { UserService } from './services/user.service';
import { FeasyService } from './services/feasy.service';
import { ErrorService } from './services/error.service';
import { LoginComponent } from './login/login.component';
import { AvatarService } from './services/avatar.service';
import { SignupComponent } from './signup/signup.component';
import { LayoutComponent } from './layout/layout.component';
import { MessagingService } from './services/messaging.service';
import { AssignmentService } from './services/assignment.service';
import { CommonUtilsService } from './utils/common-utils.service';
import { LocalStorageService } from './utils/local-storage.service';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { PasswordResetComponent } from './password-reset/password-reset.component';

// Configure client side Google API service
const gapiClientConfig: ClientConfig = {
  clientId: '442519493070-6g7gli3v0rr2cr8m7r122m677ce2i645.apps.googleusercontent.com',
  discoveryDocs: [],
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/calendar',
  ].join(' '),
  redirect_uri: 'https://api.feasy-app.com/auth/google/exchange',
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    PasswordResetComponent,
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
      useValue: gapiClientConfig,
    }),
  ],
  providers: [
    AuthGuard,
    UserService,
    FeasyService,
    ErrorService,
    AvatarService,
    MessagingService,
    AssignmentService,
    CommonUtilsService,
    LocalStorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
