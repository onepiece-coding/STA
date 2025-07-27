import { Component, effect, signal } from '@angular/core';
import { OrderListModule } from 'primeng/orderlist';
import { ICity } from '../../core/models/city.model';
import { CitiesService } from '../../core/services/cities.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-manage-cities',
  imports: [
    OrderListModule,
    ButtonModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    RouterLink,
    Dialog,
    Paginator,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './manage-cities.html',
  styleUrl: './manage-cities.scss',
})
export class ManageCities {
  nameSearch = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  createLoading = false;

  cities = signal<ICity[]>([]);
  totalCities = signal<number>(0);
  loading = false;

  private cityToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  private cityToUpdateId: string | null = null;
  showUpdateDialog = false;
  updateLoading = false;

  name!: FormControl;
  updateCityFormData!: FormGroup;

  userType!: IUser['role'];

  constructor(
    private readonly _citiesService: CitiesService,
    private readonly _messageService: MessageService,
    private readonly _authService: AuthService
  ) {
    this.initUpdateCityFormControls();
    this.initUpdateCityFormGroup();
    effect(() => {
      const page = this.currentPage();
      const cityName = this.nameSearch();
      this.loadCities(10, page, cityName);
    });
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.cityToDeleteId = id;
    this.showDeleteDialog = true;
  }

  updateDialog(event: Event, id: string) {
    event.stopPropagation();
    this.cityToUpdateId = id;
    this.showUpdateDialog = true;
    this.loadCityById();
  }

  onSubmit() {
    if (this.nameSearch() === '') {
      this.showAlert(
        'error',
        'Le champ obligatoire',
        'Le nom de la ville est obligatoire!'
      );
    } else {
      this.createLoading = true;
      this.createCity(this.nameSearch());
    }
  }

  onDeleteConfirmed() {
    if (!this.cityToDeleteId) return;

    this.deleteLoading = true;
    this._citiesService.deleteCity(this.cityToDeleteId).subscribe({
      next: () => {
        this.cities.set(
          this.cities().filter((city) => city._id !== this.cityToDeleteId)
        );
        this.showAlert('success', 'Confirmé', 'Ville supprimé avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteCity():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de la ville!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  onUpdateConfirmed() {
    if (this.updateCityFormData.invalid) {
      this.updateCityFormData.markAllAsDirty();
      this.updateCityFormData.markAllAsTouched();
    } else {
      this.updateCity(this.name.value);
    }
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
  }

  private initUpdateCityFormControls(): void {
    this.name = new FormControl('', [Validators.required]);
  }

  private initUpdateCityFormGroup(): void {
    this.updateCityFormData = new FormGroup({
      name: this.name,
    });
  }

  private createCity(cityName: string) {
    this._citiesService.createCity(cityName).subscribe({
      next: (city) => {
        this.createLoading = false;
        this.nameSearch.set('');
        this.cities.update((current) => [...current, city]);
        this.showAlert('success', 'Créer une ville', 'La ville a été créée');
      },
      error: (mistake) => {
        console.log('createCity():', mistake);
        this.createLoading = false;
        this.nameSearch.set('');
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la création de la ville!'
        );
      },
    });
  }

  private loadCities(limit: number, page: number, cityName?: string) {
    this.loading = true;
    this._citiesService.getCities(limit, page, cityName).subscribe({
      next: ({ data, meta }) => {
        this.loading = false;
        this.cities.set(data);
        this.totalCities.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadCities():', mistake);
        this.loading = false;
        this.cities.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des villes'
        );
      },
    });
  }

  private updateCity(cityName: string) {
    if (!this.cityToUpdateId) return;

    this.updateLoading = true;
    this._citiesService.updateCity(this.cityToUpdateId, cityName).subscribe({
      next: () => {
        this.showAlert('success', 'Confirmé', 'ville mis à jour avec succès');
        this.loadCities(10, this.currentPage());
        this.cleanupUpdateDialog();
      },
      error: (mistake) => {
        console.log('updateCity():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la mise à jour du ville!'
        );
        this.cleanupUpdateDialog();
      },
    });
  }

  private loadCityById() {
    if (!this.cityToUpdateId) return;

    this._citiesService.getCityById(this.cityToUpdateId!).subscribe({
      next: ({ name }) => {
        this.updateCityFormData.setValue({ name });
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
    this.cityToDeleteId = null;
  }

  private cleanupUpdateDialog() {
    this.updateLoading = false;
    this.showUpdateDialog = false;
    this.cityToUpdateId = null;
    this.updateCityFormData.reset();
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
