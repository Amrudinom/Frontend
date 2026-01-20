import { FormularFeld } from '../../../../../formularserver/src/app/components/models/form.models';
import { AntragStatus } from '@frontend/core';

export interface AntragFormularViewDto {
  ablehnungsgrund: string;
  antragId: number;
  status: AntragStatus;
  eingereichtAm: string; // ISO
  antragstellerName: string;
  formularSnapshot: FormularSnapshot | null;
  formularAntworten: Record<string, any> | null;
}

export interface FormularSnapshot {
  id: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  version?: number;
  felder: FormularFeld[];
}
export interface Nachricht {
  id: number;
  inhalt: string;
  gesendetAm: string;
  gesendetVon: {
    id: number;
    name: string;
  };
}

export interface Dokument {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: {
    id: number;
    name: string;
  };
}

