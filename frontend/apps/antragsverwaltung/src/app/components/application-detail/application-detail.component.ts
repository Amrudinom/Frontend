import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { AntragFormularViewDto, Nachricht, Dokument } from './application-detail.models';
import { FeldTyp, FormularFeld } from '../../../../../formularserver/src/app/components/models/form.models'
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css'],
})
export class ApplicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  FeldTyp = FeldTyp;

  loading = false;
  error: string | null = null;
  data: AntragFormularViewDto | null = null;

  nachrichten: Nachricht[] = [];
  dokumente: Dokument[] = [];
  messageText = '';
  uploading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error = 'Ungültige Antrag-ID';
      return;
    }
    this.load(id);
    this.loadNachrichten(id);
    this.loadDokumente(id);
  }

  load(antragId: number) {
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
            .get<AntragFormularViewDto>(
              `/api/antraege-verwaltung/${antragId}/formular`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .subscribe({
              next: (res) => {
                // sortiere Felder sicherheitshalber
                if (res.formularSnapshot?.felder) {
                  res.formularSnapshot.felder = [
                    ...res.formularSnapshot.felder,
                  ].sort(
                    (a, b) =>
                      (a.anzeigeReihenfolge ?? 0) - (b.anzeigeReihenfolge ?? 0)
                  );
                }
                this.data = res;
                this.loading = false;
              },
              error: (err) => {
                this.error =
                  'Fehler beim Laden: ' + (err?.message || 'Unbekannt');
                this.loading = false;
              },
            });
        },
        error: (err) => {
          this.error =
            'Fehler beim Token holen: ' + (err?.message || 'Unbekannt');
          this.loading = false;
        },
      });
  }

  valueForField(field: FormularFeld): any {
    return this.data?.formularAntworten?.[field.feldName];
  }

  // Anzeige-Text je Feldtyp
  displayValue(field: FormularFeld, value: any): string {
    if (value === null || value === undefined || value === '') return '—';

    switch (field.feldTyp) {
      case FeldTyp.CHECKBOX:
        return value
          ? field.checkboxLabelTrue || 'Ja'
          : field.checkboxLabelFalse || 'Nein';

      case FeldTyp.SELECT:
        // wenn optionen ein Array ist, zeigen wir Label statt Raw Value
        // optionen können string[] oder object[] sein → wir behandeln beides robust
        if (Array.isArray(field.optionen)) {
          const match = field.optionen.find((opt: any) => {
            if (typeof opt === 'string') return opt === value;
            return opt?.value === value || opt?.label === value;
          });
          if (typeof match === 'string') return match;
          if (match?.label) return match.label;
        }
        return String(value);

      case FeldTyp.FILE_UPLOAD:
        // kann String, Array, Objekt sein
        if (Array.isArray(value))
          return value.map((v) => v?.filename ?? v).join(', ');
        if (typeof value === 'object')
          return value.filename ?? JSON.stringify(value);
        return String(value);

      default:
        return String(value);
    }
  }

  isFileField(field: FormularFeld): boolean {
    return field.feldTyp === FeldTyp.FILE_UPLOAD;
  }

  loadNachrichten(antragId: number) {
    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: 'https://foerderportal-api', scope: 'openid profile email' },
    }).subscribe({
      next: (token) => {
        this.http.get<Nachricht[]>(`/api/foerderantraege/${antragId}/nachrichten`, {
          headers: { Authorization: `Bearer ${token}` },
        }).subscribe({
          next: (n) => (this.nachrichten = n),
          error: (err) => console.error('Nachrichten laden fehlgeschlagen', err),
        });
      },
      error: (err) => console.error('Token holen fehlgeschlagen', err),
    });
  }


  sendNachricht(antragId: number) {
    const text = this.messageText.trim();
    if (!text) return;

    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: 'https://foerderportal-api', scope: 'openid profile email' },
    }).subscribe({
      next: (token) => {
        this.http.post(`/api/foerderantraege/${antragId}/nachrichten`,
          { inhalt: text },
          { headers: { Authorization: `Bearer ${token}` } }
        ).subscribe({
          next: () => {
            this.messageText = '';
            this.loadNachrichten(antragId);
          },
          error: (err) => console.error('Nachricht senden fehlgeschlagen', err),
        });
      },
      error: (err) => console.error('Token holen fehlgeschlagen', err),
    });
  }


  loadDokumente(antragId: number) {
    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: 'https://foerderportal-api', scope: 'openid profile email' },
    }).subscribe(token => {
      this.http.get<Dokument[]>(`/api/foerderantraege/${antragId}/dokumente`, {
        headers: { Authorization: `Bearer ${token}` },
      }).subscribe(d => this.dokumente = d);
    });
  }

  uploadDokument(antragId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    this.uploading = true;

    this.auth.getAccessTokenSilently({
      authorizationParams: { audience: 'https://foerderportal-api', scope: 'openid profile email' },
    }).subscribe(token => {
      this.http.post(`/api/foerderantraege/${antragId}/dokumente`, form, {
        headers: { Authorization: `Bearer ${token}` },
      }).subscribe(() => {
        this.uploading = false;
        this.loadDokumente(antragId);
      }, () => this.uploading = false);
    });
  }


  downloadUrl(antragId: number, dokumentId: number) {
    return `/api/antraege-verwaltung/${antragId}/dokumente/${dokumentId}/download`;
  }
  onFileSelected(event: Event) {
    if (!this.data) return;

    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0);

    if (!file) return;

    this.uploadDokument(this.data.antragId, file);

    // optional: input reset (damit derselbe File erneut gewählt werden kann)
    // @ts-ignore
    input.value = '';
  }

}
