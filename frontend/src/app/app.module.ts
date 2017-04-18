import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent} from './app.component';

//for quick and easy styling
import { MaterialModule } from '@angular/material';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarModule } from 'angular-calendar';

//importing HammerJS (setup gesture add-on)
import 'hammerjs';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { DangerAlertComponent } from './danger-alert/danger-alert.component';
import { CalendarComponent } from './calendar/calendar.component';
import { HealthbarComponent } from './healthbar/healthbar.component';

//services
import { AssignmentService } from './services/assignment.service';

//bootstrap
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

//routing
import { AppRoutingModule } from './app-routing/routing.module';

@NgModule({

    declarations: [
        AppComponent,
        DashboardLayoutComponent,
        DangerAlertComponent,
        CalendarComponent,
        HealthbarComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        NgbModalModule.forRoot(),
        CalendarModule.forRoot(),
        MaterialModule.forRoot()

    ],
    providers: [ AssignmentService ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }
