import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import {
  AntragFormularViewDto,
  Nachricht,
  Dokument,
} from './application-detail.models';
import {
  FeldTyp,
  FormularFeld,
} from '../../../../../formularserver/src/app/components/models/form.models';
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

  // Status-Update UI
  statusOptions = [
    { value: 'IN_BEARBEITUNG', label: 'In Bearbeitung' },
    { value: 'GENEHMIGT', label: 'Genehmigt' },
    { value: 'ABGELEHNT', label: 'Abgelehnt' },
  ] as const;

  selectedStatus: string | null = null;
  ablehnungsgrund = '';
  savingStatus = false;
  statusSuccess: string | null = null;


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

                this.selectedStatus = res.status ?? null;
                this.ablehnungsgrund = res.ablehnungsgrund ?? '';

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
            .get<Nachricht[]>(`/api/foerderantraege/${antragId}/nachrichten`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .subscribe({
              next: (n) => (this.nachrichten = n),
              error: (err) =>
                console.error('Nachrichten laden fehlgeschlagen', err),
            });
        },
        error: (err) => console.error('Token holen fehlgeschlagen', err),
      });
  }

  sendNachricht(antragId: number) {
    const text = this.messageText.trim();
    if (!text) return;

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
            .post(
              `/api/foerderantraege/${antragId}/nachrichten`,
              { inhalt: text },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .subscribe({
              next: () => {
                this.messageText = '';
                this.loadNachrichten(antragId);
              },
              error: (err) =>
                console.error('Nachricht senden fehlgeschlagen', err),
            });
        },
        error: (err) => console.error('Token holen fehlgeschlagen', err),
      });
  }

  loadDokumente(antragId: number) {
    this.auth
      .getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email',
        },
      })
      .subscribe((token) => {
        this.http
          .get<Dokument[]>(`/api/foerderantraege/${antragId}/dokumente`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .subscribe((d) => (this.dokumente = d));
      });
  }

  uploadDokument(antragId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    this.uploading = true;

    this.auth
      .getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email',
        },
      })
      .subscribe((token) => {
        this.http
          .post(`/api/foerderantraege/${antragId}/dokumente`, form, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .subscribe(
            () => {
              this.uploading = false;
              this.loadDokumente(antragId);
            },
            () => (this.uploading = false)
          );
      });
  }

  downloadDokument(antragId: number, dokumentId: number) {
    this.auth
      .getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://foerderportal-api',
          scope: 'openid profile email',
        },
      })
      .subscribe({
        next: (token) => {
          const url = `/api/antraege-verwaltung/${antragId}/dokumente/${dokumentId}/download`;

          fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (r) => {
              if (!r.ok)
                throw new Error(`Download fehlgeschlagen (${r.status})`);

              // Dateiname aus Header ziehen (optional)
              const cd = r.headers.get('content-disposition') ?? '';
              const filename =
                cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)"?/i)?.[1] ??
                'download';

              const blob = await r.blob();
              return { blob, filename: decodeURIComponent(filename) };
            })
            .then(({ blob, filename }) => {
              const blobUrl = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              a.click();
              window.URL.revokeObjectURL(blobUrl);
            })
            .catch((err) => {
              console.error(err);
              alert(err.message ?? 'Download fehlgeschlagen');
            });
        },
        error: (err) => {
          console.error('Token holen fehlgeschlagen', err);
          alert('Token holen fehlgeschlagen');
        },
      });
  }

  saveStatus(antragId: number) {
    if (!this.selectedStatus) return;

    // Wenn abgelehnt: Grund zwingend (optional – je nach eurer Anforderung)
    if (this.selectedStatus === 'ABGELEHNT' && !this.ablehnungsgrund.trim()) {
      this.error = 'Bitte einen Ablehnungsgrund angeben.';
      return;
    }

    this.savingStatus = true;
    this.error = null;
    this.statusSuccess = null;

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
            .patch<any>(
              `/api/antraege-verwaltung/${antragId}/status`,
              {
                status: this.selectedStatus,
                grund: this.selectedStatus === 'ABGELEHNT' ? this.ablehnungsgrund : null,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .subscribe({
              next: (updated) => {
                // Falls Backend den ganzen Antrag zurückgibt
                if (this.data) {
                  this.data.status = updated.status ?? this.selectedStatus!;
                  // optional, wenn vorhanden:
                  this.data.ablehnungsgrund = updated.ablehnungsgrund ?? (this.selectedStatus === 'ABGELEHNT' ? this.ablehnungsgrund : null);
                }

                this.statusSuccess = 'Status wurde gespeichert.';
                this.savingStatus = false;
              },
              error: (err) => {
                this.error =
                  'Status speichern fehlgeschlagen: ' + (err?.message || 'Unbekannt');
                this.savingStatus = false;
              },
            });
        },
        error: (err) => {
          this.error =
            'Fehler beim Token holen: ' + (err?.message || 'Unbekannt');
          this.savingStatus = false;
        },
      });
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
