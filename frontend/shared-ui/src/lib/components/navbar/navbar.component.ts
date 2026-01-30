import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';


@Component({
    selector: 'lib-navbar',
    standalone: true,
    imports: [CommonModule],
    template:  `

      <header>
        <nav>
          <h1>Förderportal</h1>
          @if (auth.isAuthenticated$ | async) {
            <div class="auth-section">
              <span>Willkommen, {{ (auth.user$ | async)?.name }}!</span>
              <button (click)="logout()">Logout</button>
            </div>
          } @else {
            <button (click)="login()">Login</button>
          }
        </nav>
      </header>
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

export class NavbarComponent{
  auth = inject(AuthService)

  login():void{
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }
}
