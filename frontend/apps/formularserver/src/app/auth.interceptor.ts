import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Nur für Anfragen an unseren Backend
    if (req.url.includes('localhost:8083')) {
      return from(this.auth.getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email' // Kein offline_access
        }
      })).pipe(
        switchMap(token => {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(authReq);
        })
      );
    }

    return next.handle(req);
  }
}
