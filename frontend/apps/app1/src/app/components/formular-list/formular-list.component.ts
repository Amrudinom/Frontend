import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


/*I Inhalt von der Klasse Formular*/
export interface Formular {
  id: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  istVeroeffentlicht: boolean;
  erstelltAm: string;
}

@Component({
  selector: 'app-formulare-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '/formular-list.component.html',
  styleUrl: './formular-list.component.css'
})


export class FormulareListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  formulare: Formular[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {

    console.log('FormulareListComponent geladen')
    this.loadFormulare();
  }

  loadFormulare(){
    this.loading = true;
    this.error = null;

    this.auth.getAccessTokenSilently({
      authorizationParams: {
        audience: 'https://foerderportal-api',
        scope: 'openid profile email'
      }
    }).subscribe({
      next: (token) => {
        this.http.get<Formular[]>('/api/formulare/veroeffentlicht', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).subscribe({
          next: (data) => {
            this.formulare = data;
            this.loading = false;
            console.log('Loaded formulare:', data);
          },
          error: (err) => {
            this.error = 'Fehler beim Laden der Formulare: ' + err.message;
            this.loading = false;
            console.error(' Error loading formulare:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Fehler beim Token holen: ' + err.message;
        this.loading = false;
        console.error(' Token-Fehler:', err);
      }
    });
  }


}
