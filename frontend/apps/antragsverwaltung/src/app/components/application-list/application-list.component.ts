import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Foerderantrag, AntragStatus } from '@frontend/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-erhaltene-antraege',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
  imports: [CurrencyPipe, DatePipe, CommonModule, FormsModule],
  standalone: true,
})
export class ApplicationListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  antraege: Foerderantrag[] = [];
  loading = false;
  error: string | null = null;

  //Filter
  filter = {
    status: '',
    userId: '',
    from: '',
    to: '',
  };

  statusOptions: string[] = [
    'EINGEREICHT',
    'IN_BEARBEITUNG',
    'GENEHMIGT',
    'ABGELEHNT',
    'ZURUECKGEZOGEN',
  ];

  users: {
    id: number;
    name: string;
  }[] = [];

  ngOnInit() {
    this.loadAntraege();
    this.loadUsers();

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
            .get<Foerderantrag[]>('/api/antraege-verwaltung', {
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

  loadUsers() {
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
            .get<{ id: number; name: string }[]>('/api/users-verwaltung', {
              headers: { Authorization: `Bearer ${token}` },
            })
            .subscribe({
              next: (data) => {
                this.users = data;
              },
              error: (err) =>
                console.error('Fehler beim Laden der Benutzer:', err),
            });
        },
        error: (err) =>
          console.error('Token-Fehler beim Laden der Benutzer:', err),
      });
  }

  applyFilter(): void {
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
          let params = new HttpParams();
          if (this.filter.status)
            params = params.set('status', this.filter.status);
          if (this.filter.userId)
            params = params.set('userId', this.filter.userId);
          if (this.filter.from) params = params.set('from', this.filter.from);
          if (this.filter.to) params = params.set('to', this.filter.to);

          this.http
            .get<Foerderantrag[]>('/api/antraege-verwaltung/filter', {
              headers: { Authorization: `Bearer ${token}` },
              params,
            })
            .subscribe({
              next: (data) => {
                console.log('Gefilterte Anträge:', data);
                this.antraege = data;
                this.loading = false;
              },
              error: (err) => {
                this.error = 'Fehler beim Filtern der Anträge: ' + err.message;
                this.loading = false;
                console.error('Filter-Fehler:', err);
              },
            });
        },
        error: (err) => {
          this.error = 'Fehler beim Token holen: ' + err.message;
          this.loading = false;
          console.log('Token-Fehler: ', err);
        },
      });
  }

  resetFilter(): void {
    this.filter = { status: '', userId: '', from: '', to: '' };
    this.loadAntraege();
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
