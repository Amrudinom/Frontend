import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  Foerderantrag,
  CreateFoerderantragRequest,
  UpdateFoerderantragRequest,
  AblehnenRequest,
  AntragStatus
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  // User Endpoints
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/me`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  // Foerderantrag Endpoints
  getAllAntraege(): Observable<Foerderantrag[]> {
    return this.http.get<Foerderantrag[]>(`${this.baseUrl}/foerderantraege`);
  }

  getMyAntraege(): Observable<Foerderantrag[]> {
    return this.http.get<Foerderantrag[]>(`${this.baseUrl}/foerderantraege/my`);
  }

  getAntragById(id: number): Observable<Foerderantrag> {
    return this.http.get<Foerderantrag>(`${this.baseUrl}/foerderantraege/${id}`);
  }

  getAntraegeByStatus(status: AntragStatus): Observable<Foerderantrag[]> {
    return this.http.get<Foerderantrag[]>(`${this.baseUrl}/foerderantraege/status/${status}`);
  }

  createAntrag(antrag: CreateFoerderantragRequest): Observable<Foerderantrag> {
    return this.http.post<Foerderantrag>(`${this.baseUrl}/foerderantraege`, antrag);
  }

  updateAntrag(id: number, antrag: UpdateFoerderantragRequest): Observable<Foerderantrag> {
    return this.http.put<Foerderantrag>(`${this.baseUrl}/foerderantraege/${id}`, antrag);
  }

  genehmigenAntrag(id: number): Observable<Foerderantrag> {
    return this.http.post<Foerderantrag>(`${this.baseUrl}/foerderantraege/${id}/genehmigen`, {});
  }

  ablehnenAntrag(id: number, request: AblehnenRequest): Observable<Foerderantrag> {
    return this.http.post<Foerderantrag>(`${this.baseUrl}/foerderantraege/${id}/ablehnen`, request);
  }

  deleteAntrag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/foerderantraege/${id}`);
  }
}
