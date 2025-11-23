import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Foerderantrag, AntragStatus } from '@frontend/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-erhaltene-antraege',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
  imports: [CurrencyPipe, DatePipe, CommonModule],
  standalone: true,
})
export class ApplicationListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  antraege: Foerderantrag[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadAntraege();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url === '/erhaltene-antraege') {
          this.loadAntraege();
        }
      });
  }

  loadAntraege() {
    this.loading = true;
    this.error = null;

    this.auth
      .getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email',
        },
      })
      .subscribe({
        next: (token) => {
          this.http
            .get<Foerderantrag[]>('/api/antraege', {
              headers: { Authorization: `Bearer ${token}` },
            })
            .subscribe({
              next: (data) => {
                console.log('✅ Loaded Anträge:', data);
                this.antraege = data;
                this.loading = false;
              },
              error: (err) => {
                this.error = 'Fehler beim Laden der Anträge: ' + err.message;
                this.loading = false;
                console.error('Error loading Anträge:', err);
              },
            });
        },
        error: (err) => {
          this.error = 'Fehler beim Token holen: ' + err.message;
          this.loading = false;
          console.error('Token-Fehler:', err);
        },
      });
  }

  getStatusText(status: AntragStatus): string {
    const statusMap = {
      EINGEREICHT: 'Eingereicht',
      IN_BEARBEITUNG: 'In Bearbeitung',
      GENEHMIGT: 'Genehmigt',
      ABGELEHNT: 'Abgelehnt',
      ZURUECKGEZOGEN: 'Zurückgezogen',
    };
    return statusMap[status] || status;
  }
}
