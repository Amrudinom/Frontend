import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { getAuth0Config } from '@frontend/shared-ui';
import { AuthInterceptor } from './auth.interceptor';

// Überschreibe die Auth0-Konfiguration
const customAuthConfig = {
  ...getAuth0Config(),
  useRefreshTokens: false, // WICHTIG: Refresh Tokens deaktivieren fürs testen
  authorizationParams: {
    ...getAuth0Config().authorizationParams,
    scope: 'openid profile email', // Entferne offline_access
    audience: 'https://foerderportal-api'
  },
  httpInterceptor: {
    allowedList: [
      {
        uri: 'http://localhost:8083/api/*',
        tokenOptions: {
          authorizationParams: {
            audience: 'https://foerderportal-api',
            scope: 'openid profile email'
          }
        }
      }
    ]
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideAuth0(customAuthConfig)
  ],
};
