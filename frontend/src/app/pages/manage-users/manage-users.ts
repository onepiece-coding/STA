import { Component, effect, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { IUser } from '../../core/models/user.model';
import { Paginator, PaginatorState } from 'primeng/paginator';
import {
  ConfirmationService,
  MessageService,
  SelectItemGroup,
} from 'primeng/api';
import { UsersService } from '../../core/services/users.service';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Popover } from 'primeng/popover';
import { Dialog } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { CitiesService } from '../../core/services/cities.service';
import { SectorsService } from '../../core/services/sectors.service';
import { ToastModule } from 'primeng/toast';
import { forkJoin, map, switchMap } from 'rxjs';

type TUser = {
  en: 'sellers' | 'delivery' | 'instant-sellers';
  fr: 'Vendeur' | 'Livreur' | 'Vendeur Instantané';
};

interface City {
  name: string;
  _id: string;
}

@Component({
  selector: 'app-manage-users',
  imports: [
    Select,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    Popover,
    Paginator,
    Dialog,
    ReactiveFormsModule,
    MultiSelectModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.scss',
})
export class ManageUsers {
  usersTypes!: TUser[];
  userFilter = signal<string>('sellers');
  nameSearch = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  loadingUsers = false;
  users = signal<IUser[]>([]);
  totalUsers = signal<number>(0);

  showCreateDialog = false;
  createLoading = false;

  private userToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  private userToUpdateId: string | null = null;
  showUpdateDialog = false;
  updateLoading = false;

  selectedSectors!: FormControl<City[] | null>;
  deliverySeller!: FormControl;
  username!: FormControl;
  password!: FormControl;
  createUserFormData!: FormGroup;

  selectedSectorsToUpdate!: FormControl<string[] | null>;
  deliverySellerToUpdate!: FormControl;
  passwordToUpdate!: FormControl;
  updateUserFormData!: FormGroup;

  loadingSectors = false;
  groupedCities: SelectItemGroup[] = [];

  loadingSellers = false;
  sellers = signal<IUser[]>([]);

  constructor(
    private readonly _usersService: UsersService,
    private readonly _citiesService: CitiesService,
    private readonly _sectorsService: SectorsService,
    private readonly _messageService: MessageService
  ) {
    this.initCreateUserFormControls();
    this.initCreateUserFormGroup();
    this.initUpdateUserFormControls();
    this.initUpdateUserFormGroup();
    effect(() => {
      const userType = this.userFilter();
      const page = this.currentPage();
      const username = this.nameSearch();
      this.loadUsers(userType, page, username);
    });
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  ngOnInit() {
    this.usersTypes = [
      { en: 'sellers', fr: 'Vendeur' },
      { en: 'delivery', fr: 'Livreur' },
      { en: 'instant-sellers', fr: 'Vendeur Instantané' },
    ];
  }

  createDialog(event: Event) {
    event.stopPropagation();

    this.initCreateUserFormControls();
    this.initCreateUserFormGroup();

    this.showCreateDialog = true;
    this.loadingSectors = true;
    this.getGroupedCities$().subscribe({
      next: (groupedCities) => {
        this.loadingSectors = false;
        this.groupedCities = groupedCities;
      },
      error: (mistake) => {
        console.log('loadGroupedCities():', mistake);
        this.loadingSectors = false;
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || "Échec du chargement de l'utilisateur"
        );
      },
    });
    if (this.userFilter() === 'delivery') {
      this.loadSellers();
    }
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.userToDeleteId = id;
    this.showDeleteDialog = true;
  }

  updateDialog(event: Event, id: string) {
    event.stopPropagation();

    this.initUpdateUserFormControls();
    this.initUpdateUserFormGroup();

    this.userToUpdateId = id;
    this.showUpdateDialog = true;
    this.loadUserById();
  }

  onCreateConfirmed() {
    if (this.createUserFormData.invalid) {
      this.createUserFormData.markAllAsDirty();
      this.createUserFormData.markAllAsTouched();
    } else {
      const { selectedSectors, deliverySeller, username, password } =
        this.createUserFormData.value;
      this.createUser(this.userFilter(), {
        selectedSectors,
        username,
        password,
        deliverySeller,
      });
    }
  }

  onDeleteConfirmed() {
    if (!this.userToDeleteId) return;

    this.deleteLoading = true;
    this._usersService
      .deleteUser(this.userFilter(), this.userToDeleteId)
      .subscribe({
        next: () => {
          this.users.update((current) =>
            current.filter((user) => user._id !== this.userToDeleteId)
          );
          this.showAlert(
            'success',
            'Confirmé',
            'Utilisateur supprimé avec succès'
          );
          this.cleanupDeleteDialog();
        },
        error: (mistake) => {
          console.log('deleteUser():', mistake);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || "échec de la suppression de l'utilisateur!"
          );
          this.cleanupDeleteDialog();
        },
      });
  }

  onUpdateConfirmed() {
    if (this.updateUserFormData.invalid) {
      this.updateUserFormData.markAllAsDirty();
      this.updateUserFormData.markAllAsTouched();
    } else {
      const {
        selectedSectorsToUpdate,
        deliverySellerToUpdate,
        passwordToUpdate,
      } = this.updateUserFormData.value;
      this.updateUser(this.userFilter(), {
        selectedSectorsToUpdate,
        deliverySellerToUpdate,
        passwordToUpdate,
      });
    }
  }

  private getGroupedCities$() {
    return this._citiesService.getCities().pipe(
      switchMap(({ data: cities }) =>
        // create one inner Observable per city
        forkJoin(
          cities.map((city) =>
            this._sectorsService.getSectors(city._id).pipe(
              map((sectors) => ({
                label: city.name,
                value: city._id,
                items: sectors.map((s) => ({ label: s.name, value: s._id })),
              }))
            )
          )
        )
      )
    );
  }

  private loadSellers() {
    this.loadingSellers = true;
    this._usersService.getUsers('sellers').subscribe({
      next: ({ data }) => {
        this.loadingSellers = false;
        this.sellers.set(data);
      },
      error: (mistake) => {
        console.log('getSellers():', mistake);
        this.loadingSellers = false;
        this.sellers.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des vendeurs!'
        );
      },
    });
  }

  private initCreateUserFormControls(): void {
    this.deliverySeller = new FormControl('');
    if (this.userFilter() === 'delivery') {
      this.deliverySeller.addValidators([Validators.required]);
    }
    this.selectedSectors = new FormControl<City[]>([], Validators.required);
    this.username = new FormControl('', [Validators.required]);
    this.password = new FormControl('', [Validators.required]);
  }

  private initCreateUserFormGroup(): void {
    this.createUserFormData = new FormGroup({
      selectedSectors: this.selectedSectors,
      deliverySeller: this.deliverySeller,
      username: this.username,
      password: this.password,
    });
  }

  private initUpdateUserFormControls(): void {
    this.deliverySellerToUpdate = new FormControl('');
    if (this.userFilter() === 'delivery') {
      this.deliverySellerToUpdate.addValidators([Validators.required]);
    }
    this.selectedSectorsToUpdate = new FormControl<string[]>(
      [],
      Validators.required
    );
    this.passwordToUpdate = new FormControl('');
  }

  private initUpdateUserFormGroup(): void {
    this.updateUserFormData = new FormGroup({
      selectedSectorsToUpdate: this.selectedSectorsToUpdate,
      deliverySellerToUpdate: this.deliverySellerToUpdate,
      passwordToUpdate: this.passwordToUpdate,
    });
  }

  private createUser(path: string, formData: any) {
    this.createLoading = true;
    this._usersService.createUser(path, formData).subscribe({
      next: (user) => {
        this.createLoading = false;
        this.showAlert(
          'success',
          'Confirmé',
          `L'utilisateur a été créé avec succès`
        );
        this.totalUsers.update((current) => current + 1);
        this.users.update((current) => [...current, user]);
        this.cleanupCreateDialog();
      },
      error: (mistake) => {
        console.log('createUser():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || "Échec de la création de l'utilisateur!"
        );
        this.cleanupCreateDialog();
      },
    });
  }

  private updateUser(userType: string, formData: any) {
    this.updateLoading = true;
    this._usersService
      .updateUser(userType, this.userToUpdateId!, formData)
      .subscribe({
        next: () => {
          this.updateLoading = false;
          this.showAlert(
            'success',
            'Confirmé',
            `L'utilisateur a été mis à jour avec succès.`
          );
          this.loadUsers(this.userFilter(), this.currentPage());
          this.cleanupUpdateDialog();
        },
        error: (mistake) => {
          console.log('updateUser():', mistake);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || "Échec de la mise à jour de l'utilisateur!"
          );
          this.cleanupUpdateDialog();
        },
      });
  }

  private loadUserById() {
    if (!this.userToUpdateId) return;

    this.loadingSectors = true;

    // First fetch the user, then fetch groupedCities, then patch both
    this._usersService
      .getUserById(this.userFilter(), this.userToUpdateId!)
      .pipe(
        switchMap((user) =>
          this.getGroupedCities$().pipe(
            map((groupedCities) => ({ user, groupedCities }))
          )
        )
      )
      .subscribe({
        next: ({ user, groupedCities }) => {
          this.loadingSectors = false;

          // 1) we now have both the user **and** the fully-resolved groupedCities
          this.groupedCities = groupedCities;

          // 2) patch the form with the sector IDs
          const sectorsIds =
            this.userFilter() === 'delivery'
              ? user.deliverySectors.map((s) => s._id)
              : user.sectors.map((s) => s._id);
          this.selectedSectorsToUpdate.setValue(sectorsIds);

          // 3) if delivery-user, patch the seller too
          if (this.userFilter() === 'delivery') {
            this.deliverySellerToUpdate.setValue(user.seller ?? null);
          }
        },
        error: (mistake) => {
          console.log('loadUserById():', mistake);
          this.loadingSectors = false;
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || "Échec du chargement de l'utilisateur"
          );
        },
      });
  }

  private cleanupCreateDialog() {
    this.createLoading = false;
    this.showCreateDialog = false;
    this.createUserFormData.reset();
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.userToDeleteId = null;
  }

  private cleanupUpdateDialog() {
    this.updateLoading = false;
    this.showUpdateDialog = false;
    this.userToUpdateId = null;
    this.updateUserFormData.reset();
  }

  private loadUsers(userType: string, page: number, username?: string) {
    this.loadingUsers = true;
    this._usersService.getUsers(userType, page, username).subscribe({
      next: ({ data, meta }) => {
        this.loadingUsers = false;
        this.users.set(data);
        this.totalUsers.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadUsers():', mistake);
        this.loadingUsers = false;
        this.users.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des utilisateurs'
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
