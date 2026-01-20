import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Foerderantrag, FoerderantragDetailDto } from '@frontend/core';
import { NachrichtService, Nachricht } from '../services/nachricht.service';
import { DokumentService, Dokument } from '../services/dokument.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
@Component({
  selector: 'app-antrag-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <button (click)="goBack()" class="back-btn">Zurück</button>

      <div *ngIf="antrag" class="antrag-header">
        <h1>{{ antrag.titel }}</h1>
        <p class="beschreibung">{{ antrag.beschreibung }}</p>
        <div class="details">
          <p><strong>Betrag:</strong> {{ antrag.betrag | currency: 'EUR' }}</p>
          <p><strong>Status:</strong>
            <span [class]="'status-badge status-' + antrag.status.toLowerCase()">
              {{ getStatusText(antrag.status) }}
            </span>
          </p>
          <p><strong>Eingereicht:</strong> {{ antrag.eingereichtAm | date: 'dd.MM.yyyy' }}</p>
        </div>
      </div>

      <div class="content-grid">
        <div class="section">
          <h2>Nachrichten</h2>

          <div class="nachrichten-liste">
            <div *ngFor="let nachricht of nachrichten" class="nachricht-card">
              <div class="nachricht-header">
                <strong>{{ nachricht.gesendetVon.name }}</strong>
                <span class="datum">{{ nachricht.gesendetAm | date: 'dd.MM.yyyy HH:mm' }}</span>
              </div>
              <p class="nachricht-text">{{ nachricht.inhalt }}</p>
            </div>

            <div *ngIf="nachrichten.length === 0 && !loadingNachrichten" class="empty-state">
              Noch keine Nachrichten vorhanden
            </div>

            <div *ngIf="loadingNachrichten" class="loading">
              Lade Nachrichten...
            </div>
          </div>

          <div class="nachricht-form">
            <textarea
              [(ngModel)]="neueNachricht"
              placeholder="Nachricht schreiben..."
              rows="3"
              class="form-control">
            </textarea>
            <button
              (click)="sendNachricht()"
              [disabled]="!neueNachricht.trim() || sendingNachricht"
              class="btn btn-primary">
              {{ sendingNachricht ? 'Sende...' : 'Senden' }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2>Dokumente</h2>

          <div class="dokumente-liste">
            <div *ngFor="let dok of dokumente" class="dokument-card">
              <div class="dokument-info">
                <strong>{{ dok.filename }}</strong>
                <div class="dokument-meta">
                  <span class="file-size">{{ formatFileSize(dok.fileSize) }}</span>
                  <span class="upload-date">{{ dok.uploadedAt | date: 'dd.MM.yyyy' }}</span>
                </div>
                <span>
                    Von: {{ dok.uploadedByName || 'Unbekannt' }}
                </span>
              </div>
              <div class="dokument-actions">
                <button
                  (click)="downloadDokument(dok.id)"
                  class="btn btn-sm btn-secondary">
                  Download
                </button>
                <button
                  (click)="deleteDokument(dok.id)"
                  class="btn btn-sm btn-danger">
                  Löschen
                </button>
              </div>
            </div>

            <div *ngIf="dokumente.length === 0 && !loadingDokumente" class="empty-state">
              Keine Dokumente vorhanden
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
              class="form-control"
              [disabled]="uploadingDokument">
            <button
              (click)="uploadDokument()"
              [disabled]="!selectedFile || uploadingDokument"
              class="btn btn-primary">
              {{ uploadingDokument ? 'Lädt hoch...' : 'Hochladen' }}
            </button>
          </div>

          <div *ngIf="selectedFile" class="selected-file">
            Ausgewählt: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
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
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .back-btn:hover { background: #545b62; }

    .antrag-header {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .antrag-header h1 {
      margin: 0 0 1rem 0;
      color: #007bff;
      font-size: 1.8rem;
    }
    .beschreibung {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    .details {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .details p {
      margin: 0.5rem 0;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .status-eingereicht { background: #cce5ff; color: #004085; }
    .status-in_bearbeitung { background: #fff3cd; color: #856404; }
    .status-genehmigt { background: #d4edda; color: #155724; }
    .status-abgelehnt { background: #f8d7da; color: #721c24; }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 968px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
    }
    .section h2 {
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      color: #333;
    }

    .nachrichten-liste {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 1rem;
      flex: 1;
    }
    .nachricht-card {
      background: #f8f9fa;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 6px;
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
      font-size: 0.85rem;
    }
    .nachricht-text {
      margin: 0;
      line-height: 1.5;
      color: #333;
    }

    .nachricht-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-top: 1px solid #dee2e6;
      padding-top: 1rem;
    }

    .dokumente-liste {
      margin-bottom: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    .dokument-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      margin-bottom: 0.75rem;
      background: #f8f9fa;
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
      gap: 1rem;
      margin: 0.25rem 0;
    }
    .file-size {
      color: #6c757d;
      font-size: 0.85rem;
    }
    .upload-date {
      color: #6c757d;
      font-size: 0.85rem;
    }
    .uploader {
      color: #6c757d;
      font-size: 0.85rem;
    }
    .dokument-actions {
      display: flex;
      gap: 0.5rem;
    }

    .upload-form {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid #dee2e6;
      padding-top: 1rem;
    }

    .selected-file {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #e7f3ff;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #004085;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
      background: #f8f9fa;
      border-radius: 6px;
      border: 2px dashed #dee2e6;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #007bff;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
    }
    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #007bff;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }
    .btn-primary:disabled {
      background: #ccc;
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
      padding: 0.25rem 0.75rem;
      font-size: 0.85rem;
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
  nachrichten: Nachricht[] = [];
  dokumente: Dokument[] = [];

  neueNachricht = '';
  selectedFile: File | null = null;

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
          next: data => this.antrag = data,
          error: err => console.error('Fehler beim Laden des Antrags', err)
        });
      },
      error: err => console.error('Token-Fehler', err)
    });
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
