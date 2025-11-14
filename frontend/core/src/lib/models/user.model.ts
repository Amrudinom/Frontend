export interface User {
  id: number;
  name: string;
  email: string;
  auth0Id?: string;
  firma?: string;
  rolle: UserRolle;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRolle {
  ANTRAGSTELLER = 'ANTRAGSTELLER',
  SACHBEARBEITER = 'SACHBEARBEITER',
  ADMIN = 'ADMIN'
}

export interface Foerderantrag {
  id: number;
  titel: string;
  beschreibung: string;
  betrag: number;
  antragsteller: User;
  status: AntragStatus;
  eingereichtAm: Date;
  bearbeitetAm?: Date;
  bearbeiter?: User;
  ablehnungsgrund?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AntragStatus {
  EINGEREICHT = 'EINGEREICHT',
  IN_BEARBEITUNG = 'IN_BEARBEITUNG',
  GENEHMIGT = 'GENEHMIGT',
  ABGELEHNT = 'ABGELEHNT',
  ZURUECKGEZOGEN = 'ZURUECKGEZOGEN'
}

// DTOs for API requests
export interface CreateFoerderantragRequest {
  titel: string;
  beschreibung: string;
  betrag: number;
}

export interface UpdateFoerderantragRequest {
  titel?: string;
  beschreibung?: string;
  betrag?: number;
}

export interface AblehnenRequest {
  grund: string;
}
