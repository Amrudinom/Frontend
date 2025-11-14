import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { authInterceptor } from '@frontend/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAuth0({
      domain: 'dev-s57nbleczfjtroo4.us.auth0.com',  // z.B. dev-abc123.eu.auth0.com
      clientId: 'hgzwcL5jLOGy2De6a06vNUWPryQCGho9',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'https://foerderportal-api'  // Wie in Auth0 API definiert!
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: 'http://localhost:8080/api/*',
            tokenOptions: {
              authorizationParams: {
                audience: 'https://foerderportal-api'
              }
            }
          }
        ]
      }
    })
  ],
};
