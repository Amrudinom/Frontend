import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormService } from '../../services/form.service';
import { Formular, FormularStatus } from '../../models/form.models';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="form-builder-container">
      <header class="header">
        <h1>Formular Builder</h1>
        <button routerLink="neu" class="btn btn-primary">
          ➕ Neues Formular erstellen
        </button>
      </header>

      <div class="formulare-liste">
        <h2>Meine Formulare</h2>

        <div *ngIf="formulare.length === 0" class="keine-formulare">
          <p>Noch keine Formulare vorhanden.</p>
          <button routerLink="neu" class="btn btn-secondary">
            Erstelle dein erstes Formular
          </button>
        </div>

        <div *ngFor="let formular of formulare" class="formular-item">
          <div class="formular-info">
            <h3>{{ formular.titel }}</h3>
            <p>{{ formular.beschreibung }}</p>
            <span class="status" [class.published]="formular.status === FormularStatus.PUBLISHED">
              {{ getStatusText(formular.status) }}
            </span>
          </div>

          <div class="formular-actions">
            <button
              [routerLink]="['bearbeiten', formular.id]"
              class="btn btn-secondary">
              ✏️ Bearbeiten
            </button>
            <button
              (click)="loescheFormular(formular.id!)"
              class="btn btn-danger">
              🗑️ Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-builder-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background: #c0392b;
    }

    .formular-item {
      border: 1px solid #ddd;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: box-shadow 0.3s;
    }

    .formular-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      background: #f39c12;
      color: white;
    }

    .status.published {
      background: #27ae60;
    }

    .keine-formulare {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
    }

    .formular-actions {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class FormBuilderComponent implements OnInit {
  formulare: Formular[] = [];
  FormularStatus = FormularStatus;

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.ladeFormulare();
  }

  // Übersetze englische Status zu deutschen Texten
  getStatusText(status: FormularStatus): string {
    switch(status) {
      case FormularStatus.DRAFT: return 'ENTWURF';
      case FormularStatus.PUBLISHED: return 'VERÖFFENTLICHT';
      case FormularStatus.ARCHIVED: return 'ARCHIVIERT';
      default: return status;
    }
  }

  ladeFormulare(): void {
    // Mock-Daten mit korrekten Enum-Werten
    this.formulare = [
      {
        id: 1,
        titel: 'Beispiel Formular 1',
        beschreibung: 'Dies ist ein Beispielformular',
        kategorie: 'Allgemein',
        status: FormularStatus.DRAFT,
        felder: []
      },
      {
        id: 2,
        titel: 'Beispiel Formular 2',
        beschreibung: 'Ein weiteres Beispiel',
        kategorie: 'Anträge',
        status: FormularStatus.PUBLISHED,
        felder: []
      }
    ];
  }

  loescheFormular(id: number): void {
    if (confirm('Formular wirklich löschen?')) {
      this.formulare = this.formulare.filter(f => f.id !== id);
    }
  }
}
