import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'antraege',
    pathMatch: 'full'
  },
  {
    path: 'antraege',
    loadComponent: () =>
      import('./components/meine-antraege.component').then(m => m.MeineAntraegeComponent),
    canActivate: [AuthGuard]
  }
];
