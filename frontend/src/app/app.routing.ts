import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './login/login.component';
import { CalendarComponent } from './calendar/calendar.component';
import { HealthbarComponent } from './healthbar/healthbar.component';

const routes: Routes = [
    // { path: '', redirectTo: 'calendar', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    // { path: 'home', component: DashboardLayoutComponent, canActivate: [AuthGuard] },
    { path: 'healthbar', component: HealthbarComponent, canActivate: [AuthGuard] },

    // otherwise redirect to home
    { path: '**', redirectTo: 'home' }
];

export const routing = RouterModule.forRoot(routes);
