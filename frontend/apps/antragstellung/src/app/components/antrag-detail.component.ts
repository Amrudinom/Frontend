import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Foerderantrag, FoerderantragDetailDto } from '@frontend/core';
import { NachrichtService, Nachricht } from '../services/nachricht.service';
import { DokumentService, Dokument } from '../services/dokument.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';

interface Formularfeld {
  id: number;
  feldName: string;
  label: string;
  feldTyp: string;
  pflichtfeld: boolean;
  anzeigeReihenfolge: number;
}

interface Formular {
  id: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  felder: Formularfeld[];
}

@Component({
  selector: 'app-antrag-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <button (click)="goBack()" class="back-btn">← Zurück zur Übersicht</button>

      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Lade Antragsdaten...</p>
      </div>

      <div *ngIf="!loading && antrag" class="antrag-content">
        <div class="antrag-header">
          <div class="header-top">
            <h1>{{ antrag.titel }}</h1>
            <span [class]="'status-badge status-' + antrag.status.toLowerCase()">
              {{ getStatusText(antrag.status) }}
            </span>
          </div>
          <p class="beschreibung">{{ antrag.beschreibung }}</p>
          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">Betrag:</span>
              <span class="meta-value betrag">{{ antrag.betrag | currency: 'EUR' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Eingereicht am:</span>
              <span class="meta-value">{{ antrag.eingereichtAm | date: 'dd.MM.yyyy HH:mm' }}</span>
            </div>
            <div class="meta-item" *ngIf="antrag.bearbeitetAm">
              <span class="meta-label">Zuletzt bearbeitet:</span>
              <span class="meta-value">{{ antrag.bearbeitetAm | date: 'dd.MM.yyyy HH:mm' }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="antrag.status === 'ABGELEHNT' && antrag.ablehnungsgrund" class="ablehnungsgrund-box">
          <h3>⚠️ Ablehnungsgrund</h3>
          <p>{{ antrag.ablehnungsgrund }}</p>
        </div>

        <div class="section formular-section">
          <h2>📋 Eingereichte Formulardaten</h2>

          <div *ngIf="loadingFormular" class="loading">
            Lade Formulardaten...
          </div>

          <div *ngIf="!loadingFormular && formular && antrag.formularAntworten" class="formular-antworten">
            <div class="formular-info">
              <span class="formular-titel">Formular: {{ formular.titel }}</span>
              <span class="formular-kategorie">{{ formular.kategorie }}</span>
            </div>

            <div class="antworten-liste">
              <div *ngFor="let feld of formular.felder" class="antwort-item">
                <div class="antwort-label">
                  {{ feld.label || feld.feldName }}
                  <span *ngIf="feld.pflichtfeld" class="pflicht">*</span>
                </div>
                <div class="antwort-wert" [ngSwitch]="feld.feldTyp">
                  <span *ngSwitchCase="'CHECKBOX'">
                    {{ getAntwort(feld.feldName) === true || getAntwort(feld.feldName) === 'true' ? '✓ Ja' : '✗ Nein' }}
                  </span>
                  <span *ngSwitchCase="'DATUM'">
                    {{ getAntwort(feld.feldName) | date: 'dd.MM.yyyy' }}
                  </span>
                  <span *ngSwitchCase="'EMAIL'">
                    <a [href]="'mailto:' + getAntwort(feld.feldName)">{{ getAntwort(feld.feldName) }}</a>
                  </span>
                  <span *ngSwitchDefault>
                    {{ getAntwort(feld.feldName) || '—' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loadingFormular && (!formular || !antrag.formularAntworten)" class="no-formular">
            <p>Keine Formulardaten verfügbar.</p>
            <p class="hint">Die Formulardaten werden angezeigt, sobald ein Antrag über ein Formular eingereicht wurde.</p>
          </div>
        </div>

        <div class="content-grid">
          <div class="section">
            <h2>💬 Nachrichten</h2>

            <div class="nachrichten-liste">
              <div *ngFor="let nachricht of nachrichten" class="nachricht-card">
                <div class="nachricht-header">
                  <strong>{{ nachricht.gesendetVon.name }}</strong>
                  <span class="datum">{{ nachricht.gesendetAm | date: 'dd.MM.yyyy HH:mm' }}</span>
                </div>
                <p class="nachricht-text">{{ nachricht.inhalt }}</p>
              </div>

              <div *ngIf="nachrichten.length === 0 && !loadingNachrichten" class="empty-state">
                <span class="empty-icon">💬</span>
                <p>Noch keine Nachrichten vorhanden</p>
                <p class="hint">Senden Sie eine Nachricht an den Sachbearbeiter</p>
              </div>

              <div *ngIf="loadingNachrichten" class="loading">
                Lade Nachrichten...
              </div>
            </div>

            <div class="nachricht-form">
              <textarea
                [(ngModel)]="neueNachricht"
                placeholder="Ihre Nachricht an den Sachbearbeiter..."
                rows="3"
                class="form-control">
              </textarea>
              <button
                (click)="sendNachricht()"
                [disabled]="!neueNachricht.trim() || sendingNachricht"
                class="btn btn-primary">
                {{ sendingNachricht ? 'Sende...' : '📤 Nachricht senden' }}
              </button>
            </div>
          </div>

          <div class="section">
            <h2>📎 Dokumente</h2>

            <div class="dokumente-liste">
              <div *ngFor="let dok of dokumente" class="dokument-card">
                <div class="dokument-icon">📄</div>
                <div class="dokument-info">
                  <strong>{{ dok.filename }}</strong>
                  <div class="dokument-meta">
                    <span class="file-size">{{ formatFileSize(dok.fileSize) }}</span>
                    <span class="separator">•</span>
                    <span class="upload-date">{{ dok.uploadedAt | date: 'dd.MM.yyyy' }}</span>
                  </div>
                  <span class="uploader">Hochgeladen von: {{ dok.uploadedByName || 'Unbekannt' }}</span>
                </div>
                <div class="dokument-actions">
                  <button
                    (click)="downloadDokument(dok.id)"
                    class="btn btn-sm btn-secondary"
                    title="Herunterladen">
                    ⬇️
                  </button>
                  <button
                    (click)="deleteDokument(dok.id)"
                    class="btn btn-sm btn-danger"
                    title="Löschen">
                    🗑️
                  </button>
                </div>
              </div>

              <div *ngIf="dokumente.length === 0 && !loadingDokumente" class="empty-state">
                <span class="empty-icon">📎</span>
                <p>Keine Dokumente vorhanden</p>
                <p class="hint">Laden Sie hier zusätzliche Dokumente hoch</p>
              </div>

              <div *ngIf="loadingDokumente" class="loading">
                Lade Dokumente...
              </div>
            </div>

            <div class="upload-form">
              <input
                type="file"
                (change)="onFileSelected($event)"
                #fileInput
                class="file-input"
                id="file-upload"
                [disabled]="uploadingDokument">
              <label for="file-upload" class="file-label">
                {{ selectedFile ? selectedFile.name : '📁 Datei auswählen...' }}
              </label>
              <button
                (click)="uploadDokument()"
                [disabled]="!selectedFile || uploadingDokument"
                class="btn btn-primary">
                {{ uploadingDokument ? 'Lädt...' : '⬆️ Hochladen' }}
              </button>
            </div>

            <div *ngIf="selectedFile" class="selected-file">
              ✓ Ausgewählt: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .back-btn {
      margin-bottom: 1.5rem;
      padding: 0.6rem 1.2rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #545b62;
      transform: translateX(-3px);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #666;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .antrag-header {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
      border: 1px solid #e9ecef;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .antrag-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 600;
    }
    .beschreibung {
      color: #666;
      margin-bottom: 1.5rem;
      line-height: 1.6;
      font-size: 1.05rem;
    }
    .meta-info {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .meta-label {
      font-size: 0.85rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 1.1rem;
      color: #333;
      font-weight: 500;
    }
    .meta-value.betrag {
      color: #28a745;
      font-size: 1.3rem;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .status-eingereicht { background: #cce5ff; color: #004085; }
    .status-in_bearbeitung { background: #fff3cd; color: #856404; }
    .status-genehmigt { background: #d4edda; color: #155724; }
    .status-abgelehnt { background: #f8d7da; color: #721c24; }
    .status-zurueckgezogen { background: #e2e3e5; color: #383d41; }

    .ablehnungsgrund-box {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
      border: 1px solid #f5c6cb;
      border-left: 4px solid #dc3545;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .ablehnungsgrund-box h3 {
      margin: 0 0 0.75rem 0;
      color: #721c24;
      font-size: 1.1rem;
    }
    .ablehnungsgrund-box p {
      margin: 0;
      color: #721c24;
      line-height: 1.6;
    }

    .formular-section {
      margin-bottom: 1.5rem;
    }
    .formular-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #e7f3ff;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .formular-titel {
      font-weight: 600;
      color: #004085;
    }
    .formular-kategorie {
      background: #007bff;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
    }
    .antworten-liste {
      display: grid;
      gap: 0.75rem;
    }
    .antwort-item {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      align-items: center;
    }
    @media (max-width: 600px) {
      .antwort-item {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
    .antwort-label {
      font-weight: 500;
      color: #495057;
    }
    .pflicht {
      color: #dc3545;
      margin-left: 2px;
    }
    .antwort-wert {
      color: #212529;
      word-break: break-word;
    }
    .no-formular {
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;
    }
    .no-formular p:first-child {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    .hint {
      font-size: 0.9rem;
      color: #868e96;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 968px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .section {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      border: 1px solid #e9ecef;
    }
    .section h2 {
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      color: #333;
      font-weight: 600;
    }

    .nachrichten-liste {
      max-height: 350px;
      overflow-y: auto;
      margin-bottom: 1rem;
      flex: 1;
    }
    .nachricht-card {
      background: #f8f9fa;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      border-left: 3px solid #007bff;
    }
    .nachricht-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      align-items: center;
    }
    .datum {
      color: #6c757d;
      font-size: 0.8rem;
    }
    .nachricht-text {
      margin: 0;
      line-height: 1.5;
      color: #333;
    }

    .nachricht-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border-top: 1px solid #dee2e6;
      padding-top: 1rem;
    }

    .dokumente-liste {
      margin-bottom: 1rem;
      max-height: 350px;
      overflow-y: auto;
    }
    .dokument-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      background: #f8f9fa;
      transition: all 0.2s;
    }
    .dokument-card:hover {
      border-color: #007bff;
      background: #fff;
    }
    .dokument-icon {
      font-size: 1.5rem;
    }
    .dokument-info {
      flex: 1;
    }
    .dokument-info strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #333;
    }
    .dokument-meta {
      display: flex;
      gap: 0.5rem;
      margin: 0.25rem 0;
      align-items: center;
    }
    .separator {
      color: #dee2e6;
    }
    .file-size, .upload-date {
      color: #6c757d;
      font-size: 0.85rem;
    }
    .uploader {
      color: #868e96;
      font-size: 0.8rem;
    }
    .dokument-actions {
      display: flex;
      gap: 0.5rem;
    }

    .upload-form {
      display: flex;
      gap: 0.75rem;
      border-top: 1px solid #dee2e6;
      padding-top: 1rem;
      align-items: center;
    }
    .file-input {
      display: none;
    }
    .file-label {
      flex: 1;
      padding: 0.6rem 1rem;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      color: #6c757d;
      transition: all 0.2s;
    }
    .file-label:hover {
      border-color: #007bff;
      color: #007bff;
    }

    .selected-file {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: #d4edda;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #155724;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px dashed #dee2e6;
    }
    .empty-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      margin: 0.25rem 0;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #007bff;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }
    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .btn {
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-primary {
      background: #007bff;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-1px);
    }
    .btn-primary:disabled {
      background: #94c7ff;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    .btn-secondary:hover {
      background: #545b62;
    }
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    .btn-danger:hover {
      background: #c82333;
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
    }
  `]
})
export class AntragDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private nachrichtService = inject(NachrichtService);
  private dokumentService = inject(DokumentService);

  antragId!: number;
  antrag: FoerderantragDetailDto | null = null;
  formular: Formular | null = null;
  nachrichten: Nachricht[] = [];
  dokumente: Dokument[] = [];

  neueNachricht = '';
  selectedFile: File | null = null;

  loading = true;
  loadingFormular = false;
  loadingNachrichten = false;
  loadingDokumente = false;
  sendingNachricht = false;
  uploadingDokument = false;

  ngOnInit() {
    this.antragId = Number(this.route.snapshot.params['id']);
    this.loadAntrag();
    this.loadNachrichten();
    this.loadDokumente();
  }

  loadAntrag() {
    this.loading = true;
    this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).subscribe({
      next: token => {
        this.http.get<FoerderantragDetailDto>(`/api/foerderantraege/${this.antragId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).subscribe({
          next: data => {
            this.antrag = data;
            this.loading = false;
            if (data.formularId) {
              this.loadFormular(data.formularId, token);
            }
          },
          error: err => {
            console.error('Fehler beim Laden des Antrags', err);
            this.loading = false;
          }
        });
      },
      error: err => {
        console.error('Token-Fehler', err);
        this.loading = false;
      }
    });
  }

  loadFormular(formularId: number, token: string) {
    this.loadingFormular = true;
    this.http.get<Formular>(`/api/formulare/${formularId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: data => {
        this.formular = data;
        this.loadingFormular = false;
      },
      error: err => {
        console.error('Fehler beim Laden des Formulars', err);
        this.loadingFormular = false;
      }
    });
  }

  getAntwort(feldName: string): any {
    if (!this.antrag?.formularAntworten) return null;
    return this.antrag.formularAntworten[feldName];
  }

  loadNachrichten() {
    this.loadingNachrichten = true;
    this.nachrichtService.getNachrichten(this.antragId).subscribe({
      next: data => {
        this.nachrichten = data;
        this.loadingNachrichten = false;
      },
      error: err => {
        console.error('Fehler beim Laden der Nachrichten', err);
        this.loadingNachrichten = false;
      }
    });
  }

  loadDokumente() {
    this.loadingDokumente = true;
    this.dokumentService.getDokumente(this.antragId).subscribe({
      next: data => {
        this.dokumente = data;
        this.loadingDokumente = false;
      },
      error: err => {
        console.error('Fehler beim Laden der Dokumente', err);
        this.loadingDokumente = false;
      }
    });
  }

  sendNachricht() {
    if (!this.neueNachricht.trim()) return;

    this.sendingNachricht = true;
    this.nachrichtService.sendNachricht(this.antragId, this.neueNachricht).subscribe({
      next: () => {
        this.neueNachricht = '';
        this.sendingNachricht = false;
        this.loadNachrichten();
      },
      error: err => {
        alert('Fehler beim Senden: ' + err.message);
        this.sendingNachricht = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Datei ist zu groß! Maximum: 10MB');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadDokument() {
    if (!this.selectedFile) return;

    this.uploadingDokument = true;
    this.dokumentService.uploadDokument(this.antragId, this.selectedFile).subscribe({
      next: () => {
        this.selectedFile = null;
        this.uploadingDokument = false;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.loadDokumente();
      },
      error: err => {
        alert('Fehler beim Upload: ' + err.message);
        this.uploadingDokument = false;
      }
    });
  }

  downloadDokument(dokumentId: number) {
    this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).subscribe({
      next: token => {
        this.dokumentService.downloadDokument(this.antragId, dokumentId, token)
          .catch(err => alert('Download fehlgeschlagen: ' + err.message));
      },
      error: err => alert('Token-Fehler: ' + err.message)
    });
  }

  deleteDokument(dokumentId: number) {
    if (!confirm('Dokument wirklich löschen?')) return;

    this.dokumentService.deleteDokument(this.antragId, dokumentId).subscribe({
      next: () => this.loadDokumente(),
      error: err => alert('Fehler beim Löschen: ' + err.message)
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EINGEREICHT': 'Eingereicht',
      'IN_BEARBEITUNG': 'In Bearbeitung',
      'GENEHMIGT': 'Genehmigt',
      'ABGELEHNT': 'Abgelehnt',
      'ZURUECKGEZOGEN': 'Zurückgezogen'
    };
    return statusMap[status] || status;
  }

  goBack() {
    this.router.navigate(['/antraege']);
  }
}
