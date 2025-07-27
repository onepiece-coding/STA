import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SectorsService } from '../../core/services/sectors.service';
import { ActivatedRoute } from '@angular/router';
import { CitiesService } from '../../core/services/cities.service';
import { ISector } from '../../core/models/sector.model';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { IUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manage-sectors',
  imports: [
    ReactiveFormsModule,
    Toast,
    InputTextModule,
    ButtonModule,
    TableModule,
    Dialog,
  ],
  providers: [MessageService],
  templateUrl: './manage-sectors.html',
  styleUrl: './manage-sectors.scss',
})
export class ManageSectors {
  sectorName!: FormControl;
  createSectorFormData!: FormGroup;

  createLoading = false;

  cityId!: string;
  cityName!: string;

  sectors = signal<ISector[] | []>([]);
  loading = false;

  private sectorToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  userType!: IUser['role'];

  constructor(
    private readonly _sectorsService: SectorsService,
    private readonly _citiesService: CitiesService,
    private readonly _authService: AuthService,
    private readonly _messageService: MessageService,
    private readonly _route: ActivatedRoute
  ) {
    this.initFormControls();
    this.initFormGroup();
  }

  initFormControls(): void {
    this.sectorName = new FormControl('', [Validators.required]);
  }

  initFormGroup(): void {
    this.createSectorFormData = new FormGroup({
      sectorName: this.sectorName,
    });
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
    this.cityId = String(this._route.snapshot.paramMap.get('cityId'));
    this.loadCityById(this.cityId);
    this.loadSectors(this.cityId);
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.sectorToDeleteId = id;
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed() {
    if (!this.sectorToDeleteId) return;
    this.deleteLoading = true;
    this._sectorsService.deleteSector(this.sectorToDeleteId).subscribe({
      next: () => {
        this.sectors.update((current) =>
          current.filter((sector) => sector._id !== this.sectorToDeleteId)
        );
        this.showAlert('success', 'Confirmé', 'Secteur supprimé avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteSector():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de le secteur!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  onSubmit() {
    if (this.createSectorFormData.invalid) {
      this.createSectorFormData.markAllAsDirty();
      this.createSectorFormData.markAllAsTouched();
    } else {
      this.createLoading = true;
      const { sectorName } = this.createSectorFormData.value;
      this.createSector(sectorName);
    }
  }

  createSector(sectorName: string) {
    this._sectorsService.createSector(sectorName, this.cityId).subscribe({
      next: (sector) => {
        this.createLoading = false;
        this.createSectorFormData.reset();
        this.sectors.update((current) => [...current, sector]);
        this.showAlert('success', 'Créer un secteur', 'Le secteur a été créée');
      },
      error: (mistake) => {
        console.log('createCity():', mistake);
        this.createLoading = false;
        this.createSectorFormData.reset();
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la création de le secteur!'
        );
      },
    });
  }

  private loadSectors(cityId: string) {
    this.loading = true;
    this._sectorsService.getSectors(cityId).subscribe({
      next: (sectors) => {
        this.loading = false;
        this.sectors.set(sectors);
      },
      error: (mistake) => {
        console.log('loadSectors():', mistake);
        this.loading = false;
        this.sectors.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des secteurs'
        );
      },
    });
  }

  private loadCityById(cityId: string) {
    this._citiesService.getCityById(cityId).subscribe({
      next: ({ name }) => {
        this.cityName = name;
      },
      error: (mistake) => {
        console.log('loadCityById():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement du ville'
        );
      },
    });
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.sectorToDeleteId = null;
  }

  private showAlert(severity: string, summary: string, detail: string) {
    this._messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }
}
