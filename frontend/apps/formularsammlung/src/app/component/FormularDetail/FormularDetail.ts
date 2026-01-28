
import { Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  label: string;
  pflichtfeld: boolean;
  oauthVorfeld: boolean;
  oauthAutoFill: boolean;
  anzeigeReihenfolge: number;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  checkboxLabelTrue?: string;
  checkboxLabelFalse?: string;
  fileTypes?: string;
  optionen?: string[];
}

interface AntragRequest {
  formularId: number;
  titel: string;
  beschreibung?: string;
  antworten: { [key: string]: any };  // Alle Formular-Antworten
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
        if(feld.pflichtfeld){
          group[feld.feldName] = ['', Validators.required];
        }
        else{
          group[feld.feldName] = [''];
        }
      });

    this.formularForm = this.fb.group(group);
  }

  /* OAuth Daten werden herausgefiltert und in die FormularForm geschrieben*/
  prefillFormWithUserData() {
    if(!this.userProfile || !this.formular || !this.formularForm) return;

    const prefillData: any = {};

    this.formular.felder.forEach(feld => {

      if (feld.oauthAutoFill){
        const feldNameLower = feld.feldName.toLowerCase();
        const feldTyptLower = feld.feldTyp.toLowerCase();

        if(feldNameLower.includes('name' ) || feldTyptLower.includes('text')) {
          prefillData[feld.feldName] = this.userProfile.nickname;
        }
        else if (feldTyptLower.includes('email' ) || feldTyptLower.includes('e-mail')){
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

  /* Speichert ausgefüllte Formulare um einen Antrag zu erstellen */
  antragErstellen(){
    if(this.formularForm.invalid){
      alert('Bitte füllen Sie alle Pflichtfelder aus!')
      return;
    }

    const betragFeld = this.formular!.felder.find(f =>{
      const lowerName = f.feldName.toLowerCase();
      return f.feldTyp === 'ZAHL' &&
        (lowerName.includes('betrag') ||
        lowerName.includes('budget') ||
        lowerName.includes('summe') ||
        lowerName.includes('förderbetrag') ||
        lowerName.includes('kosten'));

    });

    const betrag = betragFeld ? parseFloat(this.formularForm.get(betragFeld.feldName)?.value) || 0:0;

    const antragData = {
      formularId: this.formular!.id,
      titel: this.formular!.titel,
      beschreibung: this.formular!.beschreibung,
      antworten: this.formularForm.value,
      betrag: betrag
    };

    console.log('Sende Antrag:', antragData);

    //POST Request
    this.http.post('/api/formulare', antragData).subscribe({
      next: (response) => {
        console.log('Antrag erfolgreich erstellt:', response);
        alert('Antrag erfolgreich erstellt!')
        this.router.navigate(['/formulare'])
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Erstellen des Antrags:', err);
        this.error = 'Fehler beim Erstellen des Antrags: ' + err.message;
        this.loading = false;
      }
    });

  }
}
