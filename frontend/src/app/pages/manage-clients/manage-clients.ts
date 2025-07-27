import { Component, effect, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DataView } from 'primeng/dataview';
import { Tag } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { IClient } from '../../core/models/client.model';
import { ICity } from '../../core/models/city.model';
import { ISector } from '../../core/models/sector.model';
import { CitiesService } from '../../core/services/cities.service';
import { ClientsService } from '../../core/services/clients.service';
import { IUser } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { SectorsService } from '../../core/services/sectors.service';
import { SalesService } from '../../core/services/sales.service';
import { Router } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';
import { dateFormat } from '../../shared/utils/date-format';

@Component({
  selector: 'app-manage-clients',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    PaginatorModule,
    Dialog,
    ToastModule,
    ButtonModule,
    InputTextModule,
    Select,
    DataView,
    Tag,
    CommonModule,
    DatePicker,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-clients.html',
  styleUrl: './manage-clients.scss',
})
export class ManageClients {
  loadingClients = false;
  clients = signal<IClient[]>([]);
  totalClients = signal<number>(0);
  clientNumberSearch = signal<string>('');
  cityFilter = signal<string>('');
  sectorFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  loadingCities = false;
  cities = signal<ICity[]>([]);

  sectorsToFilter = signal<ISector[]>([]);

  deliveries = signal<IUser[]>([]);
  loadingDeliveries = false;

  sectorsToUpdate = signal<ISector[]>([]);
  loadingSectors = false;

  private clientToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  private clientToUpdateId: string | null = null;
  showUpdateDialog = false;
  updateLoading = false;

  private targetClientId: string | null = null;
  targetClient = signal<IClient | null>(null);
  wantedDate = signal<string>('');
  showSaleDialog = false;

  private imageFile!: File | null;
  image!: FormControl;
  name!: FormControl;
  location!: FormControl;
  typeOfBusiness!: FormControl;
  city!: FormControl;
  sector!: FormControl;
  phoneNumber!: FormControl;
  deliveryMan!: FormControl;
  updateClientFormData!: FormGroup;

  user!: IUser;

  constructor(
    private readonly _citiesService: CitiesService,
    private readonly _sectorsService: SectorsService,
    private readonly _clientsService: ClientsService,
    private readonly _usersService: UsersService,
    private readonly _authService: AuthService,
    private readonly _salesService: SalesService,
    private readonly _messageService: MessageService,
    private readonly _router: Router
  ) {
    this.initUpdateClientFormControls();
    this.initUpdateClientFormGroup();
    effect(() => {
      const page = this.currentPage();
      const cityId = this.cityFilter();
      const sectorId = this.sectorFilter();
      const clientNumber = this.clientNumberSearch();
      this.loadClients(page, cityId, sectorId, clientNumber);
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

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.clientToDeleteId = id;
    this.showDeleteDialog = true;
  }

  updateDialog(event: Event, id: string) {
    event.stopPropagation();
    this.clientToUpdateId = id;
    this.showUpdateDialog = true;
    this.loadClientById(id);
  }

  saleDialog(event: Event, id: string) {
    event.stopPropagation();
    this.targetClientId = id;
    this.showSaleDialog = true;
    this.loadClientById(id);
  }

  onDeleteConfirmed() {
    if (!this.clientToDeleteId) return;

    this.deleteLoading = true;
    this._clientsService.deleteClient(this.clientToDeleteId).subscribe({
      next: () => {
        this.clients.update((current) =>
          current.filter((client) => client._id !== this.clientToDeleteId)
        );
        this.showAlert('success', 'Confirmé', 'Client supprimé avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteClient():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de client!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  onUpdateConfirmed() {
    if (this.updateClientFormData.invalid) {
      this.updateClientFormData.markAllAsDirty();
      this.updateClientFormData.markAllAsTouched();
    } else {
      const formData = new FormData();
      formData.set('image', this.imageFile!);
      formData.set('name', this.name.value);
      formData.set('location', this.location.value);
      formData.set('typeOfBusiness', this.typeOfBusiness.value);
      formData.set('city', this.city.value);
      formData.set('sector', this.sector.value);
      formData.set('phoneNumber', this.phoneNumber.value);
      formData.set('deliveryMan', this.deliveryMan.value);
      this.updateClient(formData);
    }
  }

  onSaleConfirmed() {
    if (this.wantedDate() === '') {
      return this.showAlert(
        'error',
        'Un champ obligatoire',
        "Quand il veut c'est obligatoire!"
      );
    }
    this._salesService.sale.set({
      clientId: this.targetClient()!._id,
      date: dateFormat(this.wantedDate()),
      items: [],
    });
    this.cleanupSaleDialog();
    this.showAlert('success', 'Ajouter une vente', 'vente ajoutée avec succès');
    this._router.navigateByUrl(`/${this.user.role}/manage-products`);
  }

  ngOnInit() {
    this.user = this._authService.currentUserSignal()!;
    if (this.user.role === 'delivery') {
      this.sectorsToFilter.set(this.user.deliverySectors);
    } else if (this.user.role === 'seller') {
      this.loadCities();
      this.sectorsToFilter.set(this.user.sectors);
    }
  }

  onChangeCity() {
    this.sectorFilter.set('');
  }

  onChangeSector() {
    this.cityFilter.set('');
  }

  onChangeCityToUpdate() {
    this.sector.setValue('');
    this.sector.markAllAsTouched();
    this.sector.markAllAsDirty();
    this.loadSectors(this.city.value);
  }

  onClear() {
    this.clients.set([]);
  }

  private initUpdateClientFormControls(): void {
    this.image = new FormControl('');
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

  private initUpdateClientFormGroup(): void {
    this.updateClientFormData = new FormGroup({
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

  private updateClient(formData: FormData) {
    if (!this.clientToUpdateId) return;

    this.updateLoading = true;
    this._clientsService
      .updateClient(this.clientToUpdateId, formData)
      .subscribe({
        next: () => {
          this.showAlert(
            'success',
            'Confirmé',
            'Client mis à jour avec succès'
          );
          this.loadClients(
            this.currentPage(),
            this.cityFilter(),
            this.sectorFilter()
          );
          this.cleanupUpdateDialog();
        },
        error: (mistake) => {
          console.log('updateClient():', mistake);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'Échec de la mise à jour du client!'
          );
          this.cleanupUpdateDialog();
        },
      });
  }

  private loadClientById(id: string) {
    if (!id) return;

    this._clientsService.getClientById(id).subscribe({
      next: (client) => {
        if (id === this.clientToUpdateId) {
          this.loadSectors(client.city._id);
          this.loadDeliveries();
          this.updateClientFormData.setValue({
            image: '',
            name: client.name,
            location: client.location,
            typeOfBusiness: client.typeOfBusiness,
            city: client.city._id,
            sector: client.sector._id,
            deliveryMan: client.deliveryMan._id,
            phoneNumber: client.phoneNumber,
          });
        } else if (id === this.targetClientId) {
          this.targetClient.set(client);
        }
      },
      error: (mistake) => {
        console.log('loadClientById():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement du client'
        );
      },
    });
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.clientToDeleteId = null;
  }

  private cleanupUpdateDialog() {
    this.updateLoading = false;
    this.showUpdateDialog = false;
    this.clientToUpdateId = null;
    this.updateClientFormData.reset();
  }

  private cleanupSaleDialog() {
    this.showSaleDialog = false;
    this.targetClientId = null;
  }

  private loadClients(
    page: number,
    cityId: string,
    sectorId: string,
    clientNumber?: string
  ) {
    if (!cityId && !sectorId) return;
    this.loadingClients = true;
    this._clientsService
      .getClients(page, cityId, sectorId, clientNumber)
      .subscribe({
        next: ({ data, meta }) => {
          this.loadingClients = false;
          this.clients.set(data);
          this.totalClients.set(meta.total);
        },
        error: (mistake) => {
          console.log('loadProducts():', mistake);
          this.loadingClients = false;
          this.clients.set([]);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'échec du chargement des clients'
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

  private loadSectors(cityId: string) {
    this.loadingSectors = true;
    this._sectorsService.getSectors(cityId).subscribe({
      next: (sectors) => {
        this.sectorsToUpdate.set(sectors);
        this.loadingSectors = false;
      },
      error: (mistake) => {
        console.log('loadSectors():', mistake);
        this.loadingSectors = false;
        this.sectorsToUpdate.set([]);
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
