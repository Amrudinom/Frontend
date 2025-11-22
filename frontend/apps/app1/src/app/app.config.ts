import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])

    ),
    provideAuth0({
      domain: 'dev-scatpu2erri1lnpo.us.auth0.com',  // z.B. dev-abc123.eu.auth0.com
      clientId: 'NejhD4OjQYLEfw5ACRsacshd2l1lA9uV',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'https://foerderportal-api',  // Wie in Auth0 API definiert!
        scope: 'openid profile email'
      },
      httpInterceptor: {
        allowedList: [
          '/api/*',
          'http://localhost:8080/api/*',
          {
            uri: 'http://localhost:8080/api/*',
            tokenOptions: {
              authorizationParams: {
                audience: 'https://foerderportal-api',
                scope: 'openid profile email'
              }
            }
          }
        ]
      },
      cacheLocation: "localstorage",
      useRefreshTokens: true
    })
  ],
};
