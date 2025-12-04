import { AuthConfig } from '@auth0/auth0-angular';

export function getAuth0Config(): AuthConfig{
  return{
    domain: 'dev-scatpu2erri1lnpo.us.auth0.com',
    clientId: 'NejhD4OjQYLEfw5ACRsacshd2l1lA9uV',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://foerderportal-api',
      scope: 'openid profile email'
    },
    httpInterceptor: {
      allowedList: [
        '/api/*',
        'http://localhost:8081/api/*',
        'http://localhost:8082/api/*',
        'http://localhost:8083/api/*',
        'http://localhost:8084/api/*',
        {
          uri: 'http://localhost:8081/api/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'https://foerderportal-api',
              scope: 'openid profile email'
            }
          }
        },
        {
          uri: 'http://localhost:8082/api/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'https://foerderportal-api',
              scope: 'openid profile email'
            }
          }
        },
        {
          uri: 'http://localhost:8083/api/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'https://foerderportal-api',
              scope: 'openid profile email'
            }
          }
        },
        {
          uri: 'http://localhost:8084/api/*',
          tokenOptions: {
            authorizationParams: {
              audience: 'https://foerderportal-api',
              scope: 'openid profile email'
            }
          }
        },
      ]
    },
    cacheLocation: "localstorage",
    useRefreshTokens: true
  };
}
