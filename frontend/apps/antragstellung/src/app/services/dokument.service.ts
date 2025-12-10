import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';

export interface Dokument {
  id: number;
  filename: string;
  fileSize: number;
  contentType: string;
  uploadedBy: {
    id: number;
    name: string;
  };
  uploadedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DokumentService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getDokumente(antragId: number): Observable<Dokument[]> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.get<Dokument[]>(
          `/api/foerderantraege/${antragId}/dokumente`,
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }

  uploadDokument(antragId: number, file: File): Observable<Dokument> {
    const formData = new FormData();
    formData.append('file', file);

    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.post<Dokument>(
          `/api/foerderantraege/${antragId}/dokumente`,
          formData,
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }

  downloadDokument(antragId: number, dokumentId: number, token: string): Promise<void> {
    const url = `/api/foerderantraege/${antragId}/dokumente/${dokumentId}/download`;

    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error('Download fehlgeschlagen');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteDokument(antragId: number, dokumentId: number): Observable<void> {
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).pipe(
      switchMap(token =>
        this.http.delete<void>(
          `/api/foerderantraege/${antragId}/dokumente/${dokumentId}`,
          { headers: { Authorization: `Bearer ${token}` }}
        )
      )
    );
  }
}
