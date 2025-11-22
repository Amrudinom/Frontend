import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, CommonModule],
  template: `
    <div class="app-container">
      <header>
        <nav>
          <h1>Förderportal</h1>
          <div
            class="auth-section"
            *ngIf="auth.isAuthenticated$ | async; else loggedOut"
          >
            <span>Willkommen, {{ (auth.user$ | async)?.name }}!</span>
            <button (click)="auth.logout()">Logout</button>
          </div>
          <ng-template #loggedOut>
            <button (click)="auth.loginWithRedirect()">Login</button>
          </ng-template>
        </nav>
      </header>

      <div class="layout">
        <app-sidebar></app-sidebar>
        <main>
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      header {
        background: #007bff;
        color: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
      }

      .auth-section {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      button {
        padding: 0.5rem 1rem;
        background: white;
        color: #007bff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }

      button:hover {
        background: #f0f0f0;
      }

      .layout {
        display: flex;
        flex: 1;
        min-height: calc(100vh - 80px);
      }

      main {
        flex: 1;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        transition: margin-left 0.3s ease;
      }
    `,
  ],
})
export class AppComponent implements OnInit{
  auth = inject(AuthService);
  private http = inject(HttpClient);
  title = 'app1';
  private router = inject(Router);

  ngOnInit() {
    this.auth.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) return;

      console.log("🔐 User ist eingeloggt!");

      // Token explizit abrufen
      this.auth.getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email'
        }
      }).subscribe({
        next: (token) => {
          console.log("🎫 Token erhalten:", token ? "✅ JA" : "❌ NEIN");
          console.log("🎫 Token (erste 50 Zeichen):", token?.substring(0, 50));

          // Manuell mit Token
          this.http.get('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).subscribe({
            next: (res) => console.log("✅ Backend Response:", res),
            error: (err) => console.error("❌ API Fehler:", err)
          });
        },
        error: (err) => {
          console.error("❌ Token-Fehler:", err);
        }
      });
    });
  }
  login() {
    this.auth.loginWithRedirect({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email read:users'
      }
    });
  }

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}
