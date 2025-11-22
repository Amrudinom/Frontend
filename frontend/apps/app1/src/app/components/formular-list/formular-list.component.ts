import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';



export interface Formular {
  id: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  istVeroeffentlicht: boolean;
  erstelltAm: string;
}

@Component({
  selector: 'app-formulare-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Verfügbare Formulare</h1>

      <div *ngIf="loading" class="loading">Lade Formulare...</div>

      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="formulare-grid" *ngIf="!loading">
        <div *ngFor="let formular of formulare" class="formular-card">
          <div class="card-header">
            <h3>{{ formular.titel }}</h3>
            <span
              [class]="
              formular.istVeroeffentlicht ? 'badge-aktiv' : 'badge-inaktiv'
            "
            >
            {{ formular.istVeroeffentlicht ? 'Veröffentlicht' : 'Entwurf' }}
          </span>
          </div>

          <p class="beschreibung">{{ formular.beschreibung }}</p>

          <div class="kategorie">
            <span class="kategorie-badge">{{ formular.kategorie }}</span>
          </div>
        </div>

        <div *ngIf="formulare.length === 0" class="no-data">
          <p>📋 Keine Formulare verfügbar</p>
          <p>Es sind derzeit keine veröffentlichten Formulare zur Verfügung.</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        color: #333;
        margin-bottom: 2rem;
        font-size: 2rem;
      }

      .loading {
        text-align: center;
        padding: 3rem;
        color: #666;
        font-size: 1.2rem;
      }

      .error {
        color: #dc3545;
        padding: 1rem;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin-bottom: 1rem;
      }

      .formulare-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .formular-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
      }

      .formular-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        gap: 1rem;
      }

      .card-header h3 {
        margin: 0;
        color: #007bff;
        font-size: 1.3rem;
        flex: 1;
      }

      .badge-aktiv {
        background: #d4edda;
        color: #155724;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .badge-inaktiv {
        background: #f8d7da;
        color: #721c24;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .beschreibung {
        color: #555;
        line-height: 1.6;
        margin-bottom: 1rem;
        flex: 1;
      }

      .kategorie {
        margin-bottom: 1rem;
      }

      .kategorie-badge {
        background: #e7f3ff;
        color: #0066cc;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #eee;
      }

      .datum {
        color: #666;
        font-size: 0.9rem;
      }

      .btn-primary {
        padding: 0.5rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.3s;
      }

      .btn-primary:hover:not(:disabled) {
        background: #0056b3;
      }

      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .no-data {
        text-align: center;
        padding: 4rem 2rem;
        color: #666;
        background: #f8f9fa;
        border-radius: 8px;
        grid-column: 1 / -1;
      }

      .no-data p:first-child {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }

      .reload-btn {
        padding: 0.75rem 2rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: background 0.3s;
      }

      .reload-btn:hover {
        background: #0056b3;
      }
    `,
  ],
})
export class FormulareListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  formulare: Formular[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {

    console.log('FormulareListComponent geladen')
    this.loadFormulare();
  }

  loadFormulare(){
    this.loading = true;
    this.error = null;

    this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).subscribe({
      next: (token) => {
        this.http.get<Formular[]>('/api/formulare/veroeffentlicht', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).subscribe({
          next: (data) => {
            this.formulare = data;
            this.loading = false;
            console.log('Loaded formulare:', data);
          },
          error: (err) => {
            this.error = 'Fehler beim Laden der Formulare: ' + err.message;
            this.loading = false;
            console.error(' Error loading formulare:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Fehler beim Token holen: ' + err.message;
        this.loading = false;
        console.error(' Token-Fehler:', err);
      }
    });
  }


}
