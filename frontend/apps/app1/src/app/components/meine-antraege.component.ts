import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Foerderantrag, AntragStatus } from '@frontend/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-meine-antraege',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Meine Förderanträge</h1>

      <div *ngIf="loading" class="loading">Lade Anträge...</div>

      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="antraege-list" *ngIf="!loading">
        <div *ngFor="let antrag of antraege" class="antrag-card">
          <h3>{{ antrag.titel }}</h3>
          <p class="beschreibung">{{ antrag.beschreibung }}</p>
          <div class="details">
            <p><strong>Betrag:</strong> {{ antrag.betrag | currency:'EUR' }}</p>
            <p>
              <strong>Status:</strong>
              <span [class]="'status-badge status-' + antrag.status.toLowerCase()">
                {{ getStatusText(antrag.status) }}
              </span>
            </p>
            <p><strong>Eingereicht:</strong> {{ antrag.eingereichtAm | date:'dd.MM.yyyy' }}</p>
          </div>

          <div *ngIf="antrag.status === 'ABGELEHNT' && antrag.ablehnungsgrund" class="ablehnungsgrund">
            <strong>Ablehnungsgrund:</strong>
            <p>{{ antrag.ablehnungsgrund }}</p>
          </div>
        </div>

        <div *ngIf="antraege.length === 0" class="no-data">
          <p>📋 Keine Anträge vorhanden</p>
          <p>Erstellen Sie Ihren ersten Förderantrag!</p>
        </div>
      </div>

      <button (click)="loadAntraege()" class="reload-btn">🔄 Aktualisieren</button>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
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

    .antraege-list {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .antrag-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }

    .antrag-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .antrag-card h3 {
      margin: 0 0 1rem 0;
      color: #007bff;
      font-size: 1.4rem;
    }

    .beschreibung {
      color: #555;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .details {
      display: grid;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .details p {
      margin: 0;
      color: #666;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .status-eingereicht {
      background: #cce5ff;
      color: #004085;
    }

    .status-in_bearbeitung {
      background: #fff3cd;
      color: #856404;
    }

    .status-genehmigt {
      background: #d4edda;
      color: #155724;
    }

    .status-abgelehnt {
      background: #f8d7da;
      color: #721c24;
    }

    .ablehnungsgrund {
      margin-top: 1rem;
      padding: 1rem;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
    }

    .ablehnungsgrund p {
      margin: 0.5rem 0 0 0;
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
      background: #f8f9fa;
      border-radius: 8px;
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
  `]
})
export class MeineAntraegeComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  antraege: Foerderantrag[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    console.log('MeineAntragComponent geladen');
    this.loadAntraege();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if(this.router.url == '/antraege'){
          this.loadAntraege()
        }
      })
  }

  loadAntraege() {
    this.loading = true;
    this.error = null;

    this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).subscribe({
      next: (token) => {
        // Request mit Token
        this.http.get<Foerderantrag[]>('/api/foerderantraege/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).subscribe({
          next: (data) => {
            this.antraege = data;
            this.loading = false;
            console.log('✅ Loaded antraege:', data);
          },
          error: (err) => {
            this.error = 'Fehler beim Laden der Anträge: ' + err.message;
            this.loading = false;
            console.error('Error loading antraege:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Fehler beim Token holen: ' + err.message;
        this.loading = false;
        console.error('Token-Fehler:', err);
      }
    });
  }

  getStatusText(status: AntragStatus): string {
    const statusMap = {
      'EINGEREICHT': 'Eingereicht',
      'IN_BEARBEITUNG': 'In Bearbeitung',
      'GENEHMIGT': 'Genehmigt',
      'ABGELEHNT': 'Abgelehnt',
      'ZURUECKGEZOGEN': 'Zurückgezogen'
    };
    return statusMap[status] || status;
  }
}
