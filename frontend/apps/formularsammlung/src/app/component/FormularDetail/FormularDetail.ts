
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { ActivatedRoute, Router } from '@angular/router';



interface Formular{
  id: number;
  titel: string;
  beschreibung: string;
  kategorie: string;
  felder: FormularFeld[];
}

interface FormularFeld{
  id: number;
  feldName: string;
  feldTyp: string;
  beschriftung: string;
  oauthVorfeld: string;
  anzeigeReihenfolge: number;
}



@Component({
  selector: 'app-formular-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './FormularDetail.html',
  styleUrl: './FormularDetail.css'
})

export class FormularDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  formular: Formular | null = null;
  userProfile: any = null;
  formularForm!: FormGroup;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadFormular(id);
    this.loadUserProfile();
  }

  /*ladet das Formular anhand der id*/
  loadFormular(id: number){
    this.loading = true;
    this.error = null;


    this.http.get<Formular>(`/api/formulare/${id}`).subscribe({

      next: (data) => {
        this.formular = data;
        this.loading = false;
        console.log('Formular mit Feldern: ', data);
        this.buildForm();
        this.prefillFormWithUserData();
      },
      error: (err) => {
        this.error = 'Fehler beim Laden des Formulars: ' + err.message;
        this.loading = false;
        console.log('Fehler beim Laden des Formulars: ', err);
      }
    });
  }
  /* User profil wird herausgefiltert und die Methode prefillFormWithUserData wird aufgerufen*/
  loadUserProfile(){
    this.auth.user$.subscribe({
      next: (data) =>{
        this.userProfile = data;
        console.log('User profile: ', data);
        this.prefillFormWithUserData();
      },
      error: (err) =>{
        console.log('Error loading user profile: ', err);
      }
    });
  }

  /* Die Formularfelder werden nach der Reihe angereiht*/
  buildForm() {
    if (!this.formular || !this.formular.felder) {
      console.error('Keine Felder vorhanden!', this.formular);
      return;
    }

    const group: any = {};

    this.formular.felder
      .sort((a, b) => a.anzeigeReihenfolge - b.anzeigeReihenfolge)
      .forEach(feld => {
        group[feld.feldName] = [''];
      });

    this.formularForm = this.fb.group(group);
  }

  /* Daten werden automatisch vorausgefüllt*/
  prefillFormWithUserData() {
    if(!this.userProfile || !this.formular || !this.formularForm) return;

    const prefillData: any = {};

    this.formular.felder.forEach(feld => {
      if (feld.oauthVorfeld){
        const feldNameLower = feld.feldName.toLowerCase();

        if(feldNameLower.includes('name')) {
          prefillData[feld.feldName] = this.userProfile.name || '';
        }
        else if (feldNameLower.includes('email')){
          prefillData[feld.feldName] = this.userProfile.email || '';
        }
      }
    });

    this.formularForm.patchValue(prefillData);
    console.log('Auto-Fill: ', prefillData);
  }

  goBack() {
    this.router.navigate(['/formulare']);
  }

}
