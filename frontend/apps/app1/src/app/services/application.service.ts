import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Application } from '../models/application.models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = '/api/antraege';

  constructor(private http: HttpClient) {}

  getApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(this.apiUrl);
  }
  createApplication(data: any): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, data);
  }
}
