import { Route } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { MeineAntraegeComponent} from './components/meine-antraege.component';


export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'antraege',
    pathMatch: 'full'
  },
  {
    path: 'antraege',
    component: MeineAntraegeComponent,
    canActivate: [AuthGuard]
  }
];
