import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';
import { FormEditorComponent } from './components/form-editor/form-editor.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'form-builder',
    pathMatch: 'full'
  },
  {
    path: 'form-builder',
    component: FormBuilderComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'form-builder/neu',
    component: FormEditorComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'form-builder/bearbeiten/:id',
    component: FormEditorComponent,
    // canActivate: [AuthGuard]
  }
];
