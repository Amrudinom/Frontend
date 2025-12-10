import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';

export interface Nachricht {
  id: number;
  inhalt: string;
  gesendetVon: {
    id: number;
    name: string;
    email: string;
  };
  gesendetAm: string;
}

@Injectable({
  providedIn: 'root'
})
export class NachrichtService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getNachrichten(antragId: number): Observable<Nachricht[]> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.get<Nachricht[]>(
          `/api/foerderantraege/${antragId}/nachrichten`,
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }

  sendNachricht(antragId: number, inhalt: string): Observable<Nachricht> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.post<Nachricht>(
          `/api/foerderantraege/${antragId}/nachrichten`,
          { inhalt },
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }

  deleteNachricht(antragId: number, nachrichtId: number): Observable<void> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.delete<void>(
          `/api/foerderantraege/${antragId}/nachrichten/${nachrichtId}`,
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }
}
