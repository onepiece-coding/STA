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
import { Select } from 'primeng/select';
import { ICity } from '../../core/models/city.model';
import { ISector } from '../../core/models/sector.model';
import { CitiesService } from '../../core/services/cities.service';
import { SectorsService } from '../../core/services/sectors.service';
import { ClientsService } from '../../core/services/clients.service';
import { IUser } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-create-client',
  imports: [ReactiveFormsModule, Toast, InputTextModule, ButtonModule, Select],
  providers: [MessageService],
  templateUrl: './create-client.html',
  styleUrl: './create-client.scss',
})
export class CreateClient {
  private imageFile!: File | null;

  image!: FormControl;
  name!: FormControl;
  location!: FormControl;
  typeOfBusiness!: FormControl;
  city!: FormControl;
  sector!: FormControl;
  phoneNumber!: FormControl;
  deliveryMan!: FormControl;
  createClientFormData!: FormGroup;

  createLoading = false;

  cities = signal<ICity[]>([]);
  loadingCities = false;

  sectors = signal<ISector[]>([]);
  loadingSectors = false;

  deliveries = signal<IUser[]>([]);
  loadingDeliveries = false;

  constructor(
    private readonly _citiesService: CitiesService,
    private readonly _sectorsService: SectorsService,
    private readonly _clientsService: ClientsService,
    private readonly _usersService: UsersService,
    private readonly _messageService: MessageService
  ) {
    this.initFormControls();
    this.initFormGroup();
  }

  private initFormControls(): void {
    this.image = new FormControl('', [Validators.required]);
    this.name = new FormControl('', [Validators.required]);
    this.location = new FormControl('', [Validators.required]);
    this.typeOfBusiness = new FormControl('', [Validators.required]);
    this.city = new FormControl('', [Validators.required]);
    this.sector = new FormControl('', [Validators.required]);
    this.phoneNumber = new FormControl('', [
      Validators.required,
      Validators.pattern(/^\+212(6|7)\d{8}$/),
    ]);
    this.deliveryMan = new FormControl('', [Validators.required]);
  }

  private initFormGroup(): void {
    this.createClientFormData = new FormGroup({
      image: this.image,
      name: this.name,
      location: this.location,
      typeOfBusiness: this.typeOfBusiness,
      city: this.city,
      sector: this.sector,
      phoneNumber: this.phoneNumber,
      deliveryMan: this.deliveryMan,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.imageFile = input.files[0];
      // mark the formControl valid now that we have a file
      this.image.setValue(this.imageFile.name);
      this.image.markAsDirty();
      this.image.markAsTouched();
    } else {
      this.imageFile = null;
      this.image.setValue('');
    }
  }

  onSubmit() {
    if (this.createClientFormData.invalid) {
      this.createClientFormData.markAllAsDirty();
      this.createClientFormData.markAllAsTouched();
    } else {
      this.createLoading = true;
      const formData = new FormData();
      formData.set('image', this.imageFile!);
      formData.set('name', this.name.value);
      formData.set('location', this.location.value);
      formData.set('typeOfBusiness', this.typeOfBusiness.value);
      formData.set('city', this.city.value._id);
      formData.set('sector', this.sector.value._id);
      formData.set('phoneNumber', this.phoneNumber.value);
      formData.set('deliveryMan', this.deliveryMan.value._id);
      this.createClient(formData);
    }
  }

  ngOnInit() {
    this.loadCities();
    this.loadDeliveries();
  }

  onChange() {
    if (this.city.value?._id) {
      this.loadSectors();
    }
  }

  onClear() {
    this.sectors.set([]);
  }

  private createClient(formData: FormData) {
    this._clientsService.createClient(formData).subscribe({
      next: () => {
        this.createLoading = false;
        this.createClientFormData.reset();
        this.showAlert(
          'success',
          'Créer un client',
          'Le client a été créé avec succès'
        );
      },
      error: (mistake) => {
        console.log('createClient():', mistake);
        this.createLoading = false;
        this.createClientFormData.reset();
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la création du client!'
        );
      },
    });
  }

  private loadCities() {
    this.loadingCities = true;
    this._citiesService.getCities().subscribe({
      next: ({ data }) => {
        this.cities.set(data);
        this.loadingCities = false;
      },
      error: (mistake) => {
        console.log('loadCities():', mistake);
        this.loadingCities = false;
        this.cities.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des villes!'
        );
      },
    });
  }

  private loadSectors() {
    this.loadingSectors = true;
    this._sectorsService.getSectors(this.city.value._id).subscribe({
      next: (sectors) => {
        this.sectors.set(sectors);
        this.loadingSectors = false;
      },
      error: (mistake) => {
        console.log('loadSectors():', mistake);
        this.loadingSectors = false;
        this.sectors.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des secteurs!'
        );
      },
    });
  }

  private loadDeliveries() {
    this.loadingDeliveries = true;
    this._usersService.getUsers('delivery').subscribe({
      next: ({ data }) => {
        this.deliveries.set(data);
        this.loadingDeliveries = false;
      },
      error: (mistake) => {
        console.log('loadDeliveries():', mistake);
        this.loadingDeliveries = false;
        this.deliveries.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des livreurs!'
        );
      },
    });
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
