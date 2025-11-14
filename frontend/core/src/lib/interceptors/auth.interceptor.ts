import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip interceptor for public endpoints
  if (req.url.includes('/api/public/') || req.url === 'http://localhost:8080/') {
    return next(req);
  }

  // Get the token and add it to the request
  return authService.getAccessTokenSilently().pipe(
    take(1),
    switchMap((token) => {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(clonedReq);
    }),
    catchError((error) => {
      console.error('Error getting token:', error);
      return next(req);
    })
  );
};
