export type ApplicationStatus = 'IN_BEARBEITUNG' | 'GENEHMIGT' | 'ABGELEHNT';

export interface Application {
  id: string;
  applicant: string;
  status: ApplicationStatus;
  creationDate: string;
  title?: string;
  processorId?: string;
}
