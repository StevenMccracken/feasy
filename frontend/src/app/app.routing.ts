import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { CalendarComponent } from './calendar/calendar.component';
import { HealthbarComponent } from './healthbar/healthbar.component';
// import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
    // { path: '', redirectTo: 'calendar', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    // { path: 'home', component: DashboardLayoutComponent, canActivate: [AuthGuard] },
    { path: 'healthbar', component: HealthbarComponent, canActivate: [AuthGuard] },

    // otherwise redirect to home
    { path: '**', redirectTo: 'home' }
];

export const routing = RouterModule.forRoot(routes);
