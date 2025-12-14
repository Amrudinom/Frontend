import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { FormService } from '../services/form.service';
import { Formular, FormularFeld, FormularStatus, FeldTyp } from '../models/form.models';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.css']
})
export class FormEditorComponent implements OnInit, OnDestroy {
  formularForm: FormGroup;
  isEditMode = false;
  formularId?: number;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  aktuellerStatus: FormularStatus = FormularStatus.DRAFT;
  selectedFieldIndex: number | null = null;

  // Neue Properties
  lastSaved: Date | null = null;
  showPreviewModal = false;
  autoSaveSubscription: Subscription | null = null;
  private localStorageKey = 'formEditor_autosave';

  // Verfügbare Feldtypen
  availableFieldTypes = [
    { type: FeldTyp.TEXT, label: 'Textfeld', icon: 'text_fields', description: 'Einfache Texteingabe' },
    { type: FeldTyp.EMAIL, label: 'E-Mail', icon: 'email', description: 'E-Mail-Adresse' },
    { type: FeldTyp.NUMBER, label: 'Zahl', icon: 'numbers', description: 'Numerische Eingabe' },
    { type: FeldTyp.DATE, label: 'Datum', icon: 'calendar_today', description: 'Datumauswahl' },
    { type: FeldTyp.TEXTAREA, label: 'Textbereich', icon: 'notes', description: 'Mehrzeiliger Text' },
    { type: FeldTyp.CHECKBOX, label: 'Checkbox', icon: 'check_box', description: 'Ja/Nein Auswahl' },
    { type: FeldTyp.SELECT, label: 'Auswahl', icon: 'arrow_drop_down', description: 'Dropdown-Menü' },
    { type: FeldTyp.FILE_UPLOAD, label: 'Datei-Upload', icon: 'attach_file', description: 'Datei hochladen' }
  ];

  // OAuth Mapping Optionen
  oauthMappingOptions = [
    { value: 'email', label: 'E-Mail-Adresse', description: 'E-Mail des angemeldeten Benutzers' },
    { value: 'given_name', label: 'Vorname', description: 'Vorname des angemeldeten Benutzers' },
    { value: 'family_name', label: 'Nachname', description: 'Nachname des angemeldeten Benutzers' },
    { value: 'name', label: 'Vollständiger Name', description: 'Voller Name des angemeldeten Benutzers' }
  ];

  FeldTyp = FeldTyp;
  FormularStatus = FormularStatus;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formularForm = this.fb.group({
      titel: ['', Validators.required],
      beschreibung: [''],
      kategorie: ['', Validators.required],
      status: [FormularStatus.DRAFT],
      felder: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.formularId = +params['id'];
        this.ladeFormular(this.formularId);
      } else {
        // Neues Formular - Standardfeld hinzufügen
        setTimeout(() => {
          if (this.felder.length === 0) {
            this.neuesFeld();
          }
        }, 100);
      }
    });

    // Automatische Speicherung alle 10 Sekunden
    this.autoSaveSubscription = interval(10000).subscribe(() => {
      this.saveToLocalStorage();
    });

    // Speichern bei Änderungen
    this.formularForm.valueChanges.subscribe(() => {
      this.lastSaved = new Date();
    });

    this.felder.valueChanges.subscribe(() => {
      this.lastSaved = new Date();
    });
  }

  ngOnDestroy(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  ladeFormular(id: number): void {
    this.formService.getFormularById(id).subscribe({
      next: (formular) => {
        this.formularForm.patchValue({
          titel: formular.titel,
          beschreibung: formular.beschreibung,
          kategorie: formular.kategorie,
          status: formular.status
        });

        this.aktuellerStatus = formular.status;

        // Felder laden
        this.felder.clear();
        formular.felder.forEach((feld, index) => {
          this.addField(feld, index);
        });
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Laden des Formulars: ' + error.message;
      }
    });
  }

  get felder(): FormArray {
    return this.formularForm.get('felder') as FormArray;
  }

  get status(): FormularStatus {
    return this.formularForm.get('status')?.value || FormularStatus.DRAFT;
  }

  set status(value: FormularStatus) {
    this.formularForm.get('status')?.setValue(value);
  }

  // Drag & Drop Handlers
  onDragStart(event: DragEvent, fieldType: any): void {
    event.dataTransfer?.setData('fieldType', fieldType.type);
    event.dataTransfer?.setData('fieldLabel', fieldType.label);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const fieldType = event.dataTransfer?.getData('fieldType') as FeldTyp;
    const fieldLabel = event.dataTransfer?.getData('fieldLabel');

    if (fieldType) {
      this.neuesFeldMitTyp(fieldType, fieldLabel);
      // Automatisch das neue Feld auswählen
      this.selectField(this.felder.length - 1);
    }
  }

  // Feld auswählen
  selectField(index: number): void {
    this.selectedFieldIndex = index;
    // Scroll zum Feld
    setTimeout(() => {
      const element = document.querySelector(`.feld-item[data-index="${index}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // Feld-Typ ist fix (kann nicht geändert werden)
  getFieldTypeName(type: FeldTyp): string {
    const fieldType = this.availableFieldTypes.find(ft => ft.type === type);
    return fieldType?.label || type;
  }

  // Platzhalter-Hilfetext
  getPlaceholderHint(feldTyp: FeldTyp): string {
    switch (feldTyp) {
      case FeldTyp.EMAIL: return 'email@beispiel.de';
      case FeldTyp.NUMBER: return 'Zahl eingeben';
      case FeldTyp.DATE: return 'TT.MM.JJJJ';
      case FeldTyp.TEXTAREA: return 'Mehrzeiligen Text eingeben';
      default: return 'Text eingeben';
    }
  }

  // Einfache Feld-Reihenfolge-Änderung per Buttons
  moveFieldUp(index: number): void {
    if (index > 0) {
      const fields = this.felder;
      const currentField = fields.at(index);
      const previousField = fields.at(index - 1);

      // Wert von Reihenfolge tauschen
      const currentReihenfolge = currentField.get('reihenfolge')?.value;
      const previousReihenfolge = previousField.get('reihenfolge')?.value;

      currentField.get('reihenfolge')?.setValue(previousReihenfolge);
      previousField.get('reihenfolge')?.setValue(currentReihenfolge);

      // Controls tauschen
      fields.setControl(index - 1, currentField);
      fields.setControl(index, previousField);

      // Auswahl anpassen
      if (this.selectedFieldIndex === index) {
        this.selectedFieldIndex = index - 1;
      }
    }
  }

  moveFieldDown(index: number): void {
    if (index < this.felder.length - 1) {
      const fields = this.felder;
      const currentField = fields.at(index);
      const nextField = fields.at(index + 1);

      // Wert von Reihenfolge tauschen
      const currentReihenfolge = currentField.get('reihenfolge')?.value;
      const nextReihenfolge = nextField.get('reihenfolge')?.value;

      currentField.get('reihenfolge')?.setValue(nextReihenfolge);
      nextField.get('reihenfolge')?.setValue(currentReihenfolge);

      // Controls tauschen
      fields.setControl(index + 1, currentField);
      fields.setControl(index, nextField);

      // Auswahl anpassen
      if (this.selectedFieldIndex === index) {
        this.selectedFieldIndex = index + 1;
      }
    }
  }

  neuesFeld(): void {
    const feldGroup = this.fb.group({
      feldTyp: ['TEXT', Validators.required],
      feldName: ['', [Validators.required, Validators.pattern('^[a-zA-Z_][a-zA-Z0-9_]*$')]],
      label: ['', Validators.required],
      placeholder: [''],
      defaultValue: [''],
      pflichtfeld: [false],
      oauthAutoFill: [false],
      oauthFieldMapping: [''],
      minLength: [null],
      maxLength: [null],
      regexPattern: [''],
      reihenfolge: [this.felder.length],
      // Neue Felder für erweiterte Konfiguration
      optionen: this.fb.array(['Option 1', 'Option 2']), // Für SELECT
      checkboxLabelTrue: ['Ja'], // Für CHECKBOX
      checkboxLabelFalse: ['Nein'], // Für CHECKBOX
      fileTypes: ['.pdf,.jpg,.png'], // Für FILE_UPLOAD
      maxFileSize: [10], // Für FILE_UPLOAD
      minValue: [null], // Für NUMBER
      maxValue: [null] // Für NUMBER
    });

    this.felder.push(feldGroup);
  }

  neuesFeldMitTyp(feldTyp: FeldTyp, label?: string): void {
    const feldName = this.generateFieldName(label || feldTyp.toLowerCase());

    // OAuth Auto-Fill basierend auf Feldtyp setzen
    const oauthAutoFill = feldTyp === FeldTyp.EMAIL || feldTyp === FeldTyp.TEXT;
    const oauthFieldMapping = feldTyp === FeldTyp.EMAIL ? 'email' : '';

    const feldGroup = this.fb.group({
      feldTyp: [feldTyp, Validators.required],
      feldName: [feldName, [Validators.required, Validators.pattern('^[a-zA-Z_][a-zA-Z0-9_]*$')]],
      label: [label || this.getDefaultLabel(feldTyp), Validators.required],
      placeholder: [''],
      defaultValue: [''],
      pflichtfeld: [false],
      oauthAutoFill: [oauthAutoFill],
      oauthFieldMapping: [oauthFieldMapping],
      minLength: [null],
      maxLength: [null],
      regexPattern: [''],
      reihenfolge: [this.felder.length],
      // Neue Felder für erweiterte Konfiguration
      optionen: this.fb.array(feldTyp === FeldTyp.SELECT ? ['Option 1', 'Option 2'] : []), // Für SELECT
      checkboxLabelTrue: [feldTyp === FeldTyp.CHECKBOX ? 'Ja' : ''], // Für CHECKBOX
      checkboxLabelFalse: [feldTyp === FeldTyp.CHECKBOX ? 'Nein' : ''], // Für CHECKBOX
      fileTypes: [feldTyp === FeldTyp.FILE_UPLOAD ? '.pdf,.jpg,.png' : ''], // Für FILE_UPLOAD
      maxFileSize: [feldTyp === FeldTyp.FILE_UPLOAD ? 10 : null], // Für FILE_UPLOAD
      minValue: [null], // Für NUMBER
      maxValue: [null] // Für NUMBER
    });

    this.felder.push(feldGroup);
  }

  private generateFieldName(baseName: string): string {
    // Konvertiere zu camelCase und entferne Sonderzeichen
    const sanitized = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Prüfe ob Feldname bereits existiert
    let counter = 1;
    let fieldName = sanitized;
    const existingNames = this.felder.controls.map(control => control.get('feldName')?.value);

    while (existingNames.includes(fieldName)) {
      fieldName = `${sanitized}_${counter}`;
      counter++;
    }

    return fieldName;
  }

  private getDefaultLabel(feldTyp: FeldTyp): string {
    switch (feldTyp) {
      case FeldTyp.EMAIL: return 'E-Mail-Adresse';
      case FeldTyp.TEXT: return 'Textfeld';
      case FeldTyp.NUMBER: return 'Zahl';
      case FeldTyp.DATE: return 'Datum';
      case FeldTyp.TEXTAREA: return 'Beschreibung';
      case FeldTyp.CHECKBOX: return 'Bestätigung';
      case FeldTyp.SELECT: return 'Auswahl';
      case FeldTyp.FILE_UPLOAD: return 'Datei hochladen';
      default: return 'Neues Feld';
    }
  }

  addField(feld: FormularFeld, index: number): void {
    const feldGroup = this.fb.group({
      feldTyp: [feld.feldTyp, Validators.required],
      feldName: [feld.feldName, [Validators.required, Validators.pattern('^[a-zA-Z_][a-zA-Z0-9_]*$')]],
      label: [feld.label, Validators.required],
      placeholder: [feld.placeholder],
      defaultValue: [feld.defaultValue],
      pflichtfeld: [feld.pflichtfeld],
      oauthAutoFill: [feld.oauthAutoFill],
      oauthFieldMapping: [feld.oauthFieldMapping],
      minLength: [feld.minLength],
      maxLength: [feld.maxLength],
      regexPattern: [feld.regexPattern],
      reihenfolge: [index],
      // Neue Felder mit Default-Werten
      optionen: this.fb.array(feld['optionen'] || ['Option 1', 'Option 2']),
      checkboxLabelTrue: [feld['checkboxLabelTrue'] || 'Ja'],
      checkboxLabelFalse: [feld['checkboxLabelFalse'] || 'Nein'],
      fileTypes: [feld['fileTypes'] || '.pdf,.jpg,.png'],
      maxFileSize: [feld['maxFileSize'] || 10],
      minValue: [feld['minValue'] || null],
      maxValue: [feld['maxValue'] || null]
    });

    this.felder.push(feldGroup);
  }

  entferneFeld(index: number): void {
    if (this.felder.length <= 1) {
      this.errorMessage = 'Ein Formular muss mindestens ein Feld enthalten!';
      return;
    }

    if (confirm('Soll dieses Feld wirklich gelöscht werden?')) {
      this.felder.removeAt(index);

      if (this.selectedFieldIndex === index) {
        this.selectedFieldIndex = null;
      } else if (this.selectedFieldIndex !== null && this.selectedFieldIndex > index) {
        this.selectedFieldIndex--;
      }

      // Reihenfolge der verbleibenden Felder aktualisieren
      this.felder.controls.forEach((control, i) => {
        control.get('reihenfolge')?.setValue(i);
      });
    }
  }

  getOAuthMappingLabel(value: string): string {
    const option = this.oauthMappingOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getOAuthMappingDescription(value: string): string {
    const option = this.oauthMappingOptions.find(opt => opt.value === value);
    return option ? option.description : '';
  }

  // Status-Änderungen (Buttons in der Mitte)
  setEntwurfStatus(): void {
    this.status = FormularStatus.DRAFT;
  }

  setAktivStatus(): void {
    this.status = FormularStatus.PUBLISHED;
  }

  setArchiviertStatus(): void {
    this.status = FormularStatus.ARCHIVED;
  }

  // SPEICHERN mit aktuellem Status
  speichereFormular(): void {
    if (this.formularForm.invalid) {
      this.markAllAsTouched();
      this.errorMessage = 'Bitte füllen Sie alle erforderlichen Felder aus!';
      return;
    }

    // Prüfe ob mindestens ein Feld existiert
    if (this.felder.length === 0) {
      this.errorMessage = 'Das Formular muss mindestens ein Feld enthalten!';
      return;
    }

    // Prüfe auf doppelte Feldnamen
    const fieldNames = this.felder.controls.map(control => control.get('feldName')?.value);
    const uniqueFieldNames = new Set(fieldNames);
    if (uniqueFieldNames.size !== fieldNames.length) {
      this.errorMessage = 'Die Feldnamen müssen eindeutig sein!';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Baue das Formular-Objekt
    const formularData: Formular = {
      titel: this.formularForm.get('titel')?.value,
      beschreibung: this.formularForm.get('beschreibung')?.value,
      kategorie: this.formularForm.get('kategorie')?.value,
      status: this.status,
      felder: this.felder.value.map((feld: any, index: number) => ({
        feldName: feld.feldName,
        feldTyp: feld.feldTyp,
        label: feld.label,
        placeholder: feld.placeholder,
        defaultValue: feld.defaultValue,
        pflichtfeld: feld.pflichtfeld,
        oauthAutoFill: feld.oauthAutoFill,
        oauthFieldMapping: feld.oauthFieldMapping,
        minLength: feld.minLength,
        maxLength: feld.maxLength,
        regexPattern: feld.regexPattern,
        reihenfolge: index,
        // Neue Felder für erweiterte Konfiguration
        optionen: feld.optionen,
        checkboxLabelTrue: feld.checkboxLabelTrue,
        checkboxLabelFalse: feld.checkboxLabelFalse,
        fileTypes: feld.fileTypes,
        maxFileSize: feld.maxFileSize,
        minValue: feld.minValue,
        maxValue: feld.maxValue
      }))
    };

    const saveObservable = this.isEditMode && this.formularId
      ? this.formService.updateFormular(this.formularId, formularData)
      : this.formService.createFormular(formularData);

    saveObservable.subscribe({
      next: (savedFormular) => {
        this.isSaving = false;
        this.successMessage = this.getSuccessMessage(this.status);
        this.aktuellerStatus = this.status;

        // Temporäre Daten löschen
        localStorage.removeItem(this.localStorageKey);

        // Nach 3 Sekunden weiterleiten
        setTimeout(() => {
          this.router.navigate(['/form-builder']);
        }, 3000);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = 'Fehler beim Speichern: ' + (error.error?.message || error.message || 'Unbekannter Fehler');
        console.error('Fehler beim Speichern:', error);
      }
    });
  }

  private getSuccessMessage(status: FormularStatus): string {
    switch (status) {
      case FormularStatus.DRAFT:
        return 'Formular erfolgreich als Entwurf gespeichert!';
      case FormularStatus.PUBLISHED:
        return 'Formular erfolgreich veröffentlicht! Es ist jetzt für Bürger sichtbar.';
      case FormularStatus.ARCHIVED:
        return 'Formular erfolgreich archiviert! Es ist nicht mehr sichtbar.';
      default:
        return 'Formular erfolgreich gespeichert!';
    }
  }

  getStatusBadgeClass(status: FormularStatus): string {
    switch (status) {
      case FormularStatus.DRAFT:
        return 'status-draft';
      case FormularStatus.PUBLISHED:
        return 'status-published';
      case FormularStatus.ARCHIVED:
        return 'status-archived';
      default:
        return 'status-draft';
    }
  }

  getStatusText(status: FormularStatus): string {
    switch (status) {
      case FormularStatus.DRAFT:
        return 'ENTWURF';
      case FormularStatus.PUBLISHED:
        return 'VERÖFFENTLICHT';
      case FormularStatus.ARCHIVED:
        return 'ARCHIVIERT';
      default:
        return status;
    }
  }

  private markAllAsTouched(): void {
    this.formularForm.markAllAsTouched();
    this.felder.controls.forEach(control => {
      control.markAllAsTouched();
    });
  }

  // Hilfsfunktion für UI
  getFieldIcon(feldTyp: FeldTyp): string {
    const fieldType = this.availableFieldTypes.find(ft => ft.type === feldTyp);
    return fieldType?.icon || 'text_fields';
  }

  showOAuthInfo(feld: AbstractControl): boolean {
    return feld.get('oauthAutoFill')?.value && feld.get('oauthFieldMapping')?.value;
  }

  // NEUE METHODEN FÜR ERWEITERTE KONFIGURATION

  // Für SELECT-Felder: Optionen verwalten
  getOptionenArray(fieldIndex: number): FormArray {
    const field = this.felder.at(fieldIndex);
    return field.get('optionen') as FormArray;
  }

  addOption(fieldIndex: number): void {
    const optionenArray = this.getOptionenArray(fieldIndex);
    optionenArray.push(this.fb.control(`Option ${optionenArray.length + 1}`));
  }

  removeOption(fieldIndex: number, optionIndex: number): void {
    const optionenArray = this.getOptionenArray(fieldIndex);
    if (optionenArray.length > 1) {
      optionenArray.removeAt(optionIndex);
    } else {
      this.errorMessage = 'Ein SELECT-Feld muss mindestens eine Option haben!';
    }
  }

  updateOption(fieldIndex: number, optionIndex: number, value: string): void {
    const optionenArray = this.getOptionenArray(fieldIndex);
    optionenArray.at(optionIndex).setValue(value);
  }

  // Für CHECKBOX-Felder: Labels aktualisieren
  updateCheckboxLabel(fieldIndex: number, which: 'true' | 'false', value: string): void {
    const field = this.felder.at(fieldIndex);
    if (which === 'true') {
      field.get('checkboxLabelTrue')?.setValue(value);
    } else {
      field.get('checkboxLabelFalse')?.setValue(value);
    }
  }

  // Neue Methode zum Aktualisieren von Feldwerten
  updateFieldValue(fieldIndex: number, fieldName: string, value: any): void {
    const field = this.felder.at(fieldIndex);
    field.get(fieldName)?.setValue(value);
    field.get(fieldName)?.markAsDirty();
    field.get(fieldName)?.updateValueAndValidity();
  }

  // Vorschau-Button
  openPreview(): void {
    this.showPreviewModal = true;
  }

  closePreview(): void {
    this.showPreviewModal = false;
  }

  // Validierungshinweise anzeigen
  showValidationHints(feld: AbstractControl): boolean {
    return !!(
      feld.get('minLength')?.value ||
      feld.get('maxLength')?.value ||
      feld.get('minValue')?.value ||
      feld.get('maxValue')?.value ||
      feld.get('regexPattern')?.value
    );
  }

  // LOCAL STORAGE AUTOSAVE
  private saveToLocalStorage(): void {
    const saveData = {
      formData: this.formularForm.value,
      fields: this.felder.value,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(this.localStorageKey, JSON.stringify(saveData));
    this.lastSaved = new Date();
  }

  private loadFromLocalStorage(): void {
    if (this.isEditMode) return; // Nicht laden im Edit-Modus

    const savedData = localStorage.getItem(this.localStorageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        if (parsed.formData) {
          this.formularForm.patchValue(parsed.formData);
        }

        if (parsed.fields && this.felder.length === 0) {
          parsed.fields.forEach((field: any) => {
            const feldGroup = this.fb.group({
              feldTyp: [field.feldTyp || 'TEXT'],
              feldName: [field.feldName || ''],
              label: [field.label || ''],
              placeholder: [field.placeholder || ''],
              defaultValue: [field.defaultValue || ''],
              pflichtfeld: [field.pflichtfeld || false],
              oauthAutoFill: [field.oauthAutoFill || false],
              oauthFieldMapping: [field.oauthFieldMapping || ''],
              minLength: [field.minLength || null],
              maxLength: [field.maxLength || null],
              regexPattern: [field.regexPattern || ''],
              reihenfolge: [field.reihenfolge || this.felder.length],
              optionen: this.fb.array(field.optionen || ['Option 1', 'Option 2']),
              checkboxLabelTrue: [field.checkboxLabelTrue || 'Ja'],
              checkboxLabelFalse: [field.checkboxLabelFalse || 'Nein'],
              fileTypes: [field.fileTypes || '.pdf,.jpg,.png'],
              maxFileSize: [field.maxFileSize || 10],
              minValue: [field.minValue || null],
              maxValue: [field.maxValue || null]
            });
            this.felder.push(feldGroup);
          });
        }

        if (parsed.timestamp) {
          this.lastSaved = new Date(parsed.timestamp);
        }
      } catch (e) {
        console.error('Fehler beim Laden aus localStorage:', e);
      }
    }
  }
}
