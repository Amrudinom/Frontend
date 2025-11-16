import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], // ReactiveFormsModule hier importieren
  template: `
    <div class="form-editor-container">
      <div class="header">
        <h1>Formular Editor</h1>
        <button routerLink="/form-builder" class="btn btn-secondary">
          ← Zurück zur Übersicht
        </button>
      </div>

      <div class="editor-content">
        <h2>Neues Formular erstellen</h2>

        <form [formGroup]="formularForm" (ngSubmit)="speichereFormular()">
          <div class="form-group">
            <label for="titel">Formular Titel *</label>
            <input type="text" id="titel" formControlName="titel" class="form-control">
          </div>

          <div class="form-group">
            <label for="beschreibung">Beschreibung</label>
            <textarea id="beschreibung" formControlName="beschreibung" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label for="kategorie">Kategorie</label>
            <input type="text" id="kategorie" formControlName="kategorie" class="form-control">
          </div>

          <div class="form-felder-section">
            <h3>Formular Felder</h3>

            <div formArrayName="felder">
              <div *ngFor="let feld of felder.controls; let i = index" [formGroupName]="i" class="feld-item">
                <div class="feld-header">
                  <h4>Feld {{ i + 1 }}</h4>
                  <button type="button" (click)="entferneFeld(i)" class="btn btn-danger btn-sm">🗑️</button>
                </div>

                <div class="feld-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Feld Typ</label>
                      <select formControlName="feldTyp" class="form-control">
                        <option value="TEXT">Text</option>
                        <option value="EMAIL">E-Mail</option>
                        <option value="NUMBER">Zahl</option>
                        <option value="DATE">Datum</option>
                        <option value="SELECT">Auswahl</option>
                        <option value="TEXTAREA">Textbereich</option>
                        <option value="CHECKBOX">Checkbox</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Label *</label>
                      <input type="text" formControlName="label" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Feld Name *</label>
                      <input type="text" formControlName="feldName" class="form-control">
                    </div>

                    <div class="form-group">
                      <label>Platzhalter</label>
                      <input type="text" formControlName="placeholder" class="form-control">
                    </div>
                  </div>

                  <div class="form-options">
                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="pflichtfeld">
                      Pflichtfeld
                    </label>

                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="oauthAutoFill">
                      Mit OAuth-Daten vorausfüllen
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" (click)="neuesFeld()" class="btn btn-secondary">
              Neues Feld hinzufügen
            </button>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="!formularForm.valid">
              Formular speichern
            </button>
            <button type="button" routerLink="/form-builder" class="btn btn-secondary">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-editor-container {
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

    .form-group {
      margin-bottom: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    .form-felder-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .feld-item {
      background: white;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 6px;
      border: 1px solid #ddd;
    }

    .feld-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eee;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-options {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
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

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn:hover:not(:disabled) {
      opacity: 0.9;
    }
  `]
})
export class FormEditorComponent {
  formularForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formularForm = this.fb.group({
      titel: ['', Validators.required],
      beschreibung: [''],
      kategorie: [''],
      felder: this.fb.array([])
    });
  }

  get felder(): FormArray {
    return this.formularForm.get('felder') as FormArray;
  }

  neuesFeld(): void {
    const feldGroup = this.fb.group({
      feldTyp: ['TEXT', Validators.required],
      feldName: ['', Validators.required],
      label: ['', Validators.required],
      placeholder: [''],
      pflichtfeld: [false],
      oauthAutoFill: [false]
    });

    this.felder.push(feldGroup);
  }

  entferneFeld(index: number): void {
    this.felder.removeAt(index);
  }

  speichereFormular(): void {
    if (this.formularForm.valid) {
      console.log('Formular gespeichert:', this.formularForm.value);
      alert('Formular erfolgreich gespeichert!');
    } else {
      alert('Bitte füllen Sie alle Pflichtfelder aus!');
    }
  }
}
