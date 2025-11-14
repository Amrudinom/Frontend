import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="app-container">
      <header>
        <nav>
          <h1>Förderportal</h1>
          <div class="auth-section" *ngIf="auth.isAuthenticated$ | async; else loggedOut">
            <span>Willkommen, {{ (auth.user$ | async)?.name }}!</span>
            <button (click)="auth.logout()">Logout</button>
          </div>
          <ng-template #loggedOut>
            <button (click)="auth.loginWithRedirect()">Login</button>
          </ng-template>
        </nav>
      </header>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: #007bff;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  title = 'app1';
}
