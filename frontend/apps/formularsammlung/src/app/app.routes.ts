import { Route } from '@angular/router';
import { FormulareListComponent } from './component/formular-list/formular-list.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { FormularDetailComponent } from './component/FormularDetail/FormularDetail';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'formulare',
    pathMatch: "full"
  },
  {
    path: 'formulare',
    component: FormulareListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'formulare/:id',
    component: FormularDetailComponent,
    canActivate: [AuthGuard]
  }

];
