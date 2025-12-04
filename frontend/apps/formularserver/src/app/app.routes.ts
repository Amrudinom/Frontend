import { Route } from '@angular/router';
import {FormBuilderComponent} from './components/form-builder/form-builder.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { FormEditorComponent} from './components/form-editor/form-editor.component';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'form-builder',
    pathMatch: 'full'
  },
  {
    path: 'form-builder',
    component: FormBuilderComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'form-builder/neu',
    component: FormEditorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'form-builder/bearbeiten/:id',
    component: FormEditorComponent,
    canActivate: [AuthGuard]
  },

];
