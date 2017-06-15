import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent} from './app.component';
// import { AppRoutingModule } from './app-routing/routing.module';
import { routing } from './app.routing';

import { AuthGuard } from './guards/auth.guard';
import { LoginService } from './services/login.service';
import { AssignmentService } from './services/assignment.service';
import { LoginComponent } from './login/login.component';

import { CalendarComponent } from './calendar/calendar.component';
import { HealthbarComponent } from './healthbar/healthbar.component';
import { DangerAlertComponent } from './danger-alert/danger-alert.component';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

// For quick and easy styling
import { CalendarModule } from 'angular-calendar';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Importing HammerJS (setup gesture add-on)
import 'hammerjs';

// Bootstrap
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        DashboardLayoutComponent,
        DangerAlertComponent,
        CalendarComponent,
        HealthbarComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        routing,
        BrowserAnimationsModule,
        NgbModalModule.forRoot(),
        CalendarModule.forRoot(),
        MaterialModule.forRoot()
    ],
    providers: [
        AuthGuard,
        LoginService,
        AssignmentService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
