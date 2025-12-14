export interface Formular {
  id?: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  status: FormularStatus;
  felder: FormularFeld[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormularFeld {
  id?: number;
  feldName: string;
  feldTyp: FeldTyp;
  label: string;
  placeholder: string;
  defaultValue: string;
  pflichtfeld: boolean;
  oauthAutoFill: boolean;
  oauthFieldMapping: string;
  minLength?: number;
  maxLength?: number;
  regexPattern: string;
  reihenfolge: number;
  optionen?: string[];
  checkboxLabelTrue?: string;
  checkboxLabelFalse?: string;
  fileTypes?: string;
  maxFileSize?: number;
  minValue?: number;
  maxValue?: number;
}

// ENTFERNE UMLAUTE - verwende englische Bezeichnungen
export enum FormularStatus {
  DRAFT = 'DRAFT',          // war: ENTWURF
  PUBLISHED = 'PUBLISHED',  // war: VERÖFFENTLICHT
  ARCHIVED = 'ARCHIVED'     // war: ARCHIVIERT
}

export enum FeldTyp {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  TEXTAREA = 'TEXTAREA',
  CHECKBOX = 'CHECKBOX',
  FILE_UPLOAD = 'FILE_UPLOAD'
}
