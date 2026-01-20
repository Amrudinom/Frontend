import { Route } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { ApplicationListComponent } from './components/application-list/application-list.component';
import { ApplicationDetailComponent } from './components/application-detail/application-detail.component';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'antraege',
    pathMatch: 'full',
  },

  {
    path: 'antraege',
    component: ApplicationListComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'antraege-verwaltung/:id',
    loadComponent: () =>
      import('./components/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
  },
];
