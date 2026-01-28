import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { BackendUser, UserRolle } from './components/models/form.models';

@Injectable({
  providedIn: 'root'
})
export class SachbearbeiterGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  canActivate(): Observable<boolean> {
    const apiUrl = 'http://localhost:8083/api/users/me';
    console.log('🔐 Guard: Prüfe User-Rolle via', apiUrl);

    return this.http.get<BackendUser>(apiUrl).pipe(
      take(1),
      map((response: BackendUser) => {
        console.log('Guard: Backend-Antwort:', response);

        // Jetzt kennt TypeScript das 'rolle' Feld!
        const userRolle = response.rolle;

        console.log(`Guard: Rolle aus Datenbank: ${userRolle}`);
        console.log(`User Email: ${response.email}`);

        if (!userRolle) {
          console.error('Guard: Keine Rolle im User-Objekt gefunden!');
          return false;
        }

        const isAllowed = userRolle === UserRolle.SACHBEARBEITER ||
          userRolle === UserRolle.ADMIN;

        if (isAllowed) {
          console.log(`Guard: Zugriff als ${userRolle} erlaubt`);
          return true;
        } else {
          console.log(`Guard: Zugriff als ${userRolle} verweigert`);
          this.router.navigate(['/']);
          alert(`Zugriff verweigert. Ihre Rolle: ${userRolle}. Nur Sachbearbeiter oder Administratoren dürfen Formulare erstellen.`);
          return false;
        }
      })
    );
  }
}
