import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Formular } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = 'http://localhost:8080/api/formulare';

  constructor(private http: HttpClient) {}

  getFormulare(): Observable<Formular[]> {
    return this.http.get<Formular[]>(this.apiUrl);
  }

  getFormularById(id: number): Observable<Formular> {
    return this.http.get<Formular>(`${this.apiUrl}/${id}`);
  }

  createFormular(formular: Formular): Observable<Formular> {
    return this.http.post<Formular>(this.apiUrl, formular);
  }

  updateFormular(id: number, formular: Formular): Observable<Formular> {
    return this.http.put<Formular>(`${this.apiUrl}/${id}`, formular);
  }

  veroeffentlicheFormular(id: number): Observable<Formular> {
    return this.http.post<Formular>(`${this.apiUrl}/${id}/veroeffentlichen`, {});
  }
  zurueckziehenFormular(id: number): Observable<Formular> {
    return this.http.post<Formular>(`${this.apiUrl}/${id}/zurueckziehen`, {});
  }

  deleteFormular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
