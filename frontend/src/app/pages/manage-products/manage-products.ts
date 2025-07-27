import { Component, effect, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoriesService } from '../../core/services/categories.service';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProductsService } from '../../core/services/products.service';
import { IProduct } from '../../core/models/product.model';
import { ICategory } from '../../core/models/categories.model';
import { Select } from 'primeng/select';
import { DataView } from 'primeng/dataview';
import { Tag } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/models/user.model';
import { Dialog } from 'primeng/dialog';
import { SuppliesService } from '../../core/services/supplies.service';
import { DatePicker } from 'primeng/datepicker';
import { TSupply } from '../../shared/types/supply.type';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { dateFormat } from '../../shared/utils/date-format';
import { InputNumber } from 'primeng/inputnumber';
import { Fluid } from 'primeng/fluid';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-manage-products',
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
    InputNumber,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-products.html',
  styleUrl: './manage-products.scss',
})
export class ManageProducts {
  loadingProducts = false;
  products = signal<IProduct[]>([]);
  totalProducts = signal<number>(0);
  nameSearch = signal<string>('');
  categoryFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  loadingCategories = false;
  categories = signal<ICategory[]>([]);

  private productToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  private productToUpdateId: string | null = null;
  showUpdateDialog = false;
  updateLoading = false;

  private productToAddSuplyForItId: string | null = null;
  showSupplyDialog = false;
  addSupplyLoading = false;

  showPickSaleDateDialog = false;
  saleDate = signal<string>('');

  private productToSaleId: string | null = null;
  quantityToSale = signal<number>(1);
  productPrice = signal<number>(0);
  salePrice = signal<number>(0);
  showSaleDialog = false;
  addSaleLoading = false;

  addOrderLoading = false;

  private imageFile!: File | null;
  image!: FormControl;
  name!: FormControl;
  category!: FormControl;
  unitPrice!: FormControl;
  minQty!: FormControl;
  percent!: FormControl;
  globalDiscountPercent!: FormControl;
  updateProductFormData!: FormGroup;

  expiringAt!: FormControl;
  quantity!: FormControl;
  supplyFormData!: FormGroup;

  userType!: IUser['role'];

  constructor(
    private readonly _categoriesService: CategoriesService,
    private readonly _productsService: ProductsService,
    private readonly _authService: AuthService,
    readonly _suppliesService: SuppliesService,
    private readonly _messageService: MessageService,
    private readonly _activatedRoute: ActivatedRoute,
    readonly _salesService: SalesService,
    readonly _ordersService: OrdersService
  ) {
    this.initUpdateProductFormControls();
    this.initUpdateProductFormGroup();
    this.initSupplyFormControls();
    this.initSupplyFormGroup();
    effect(() => {
      const page = this.currentPage();
      const productName = this.nameSearch();
      const categoryId = this.categoryFilter();
      this.loadProducts(page, categoryId, productName);
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

  getSeverity(currentStock: number) {
    if (currentStock >= 30) {
      return 'success';
    } else if (currentStock < 30 && currentStock > 15) {
      return 'warn';
    } else {
      return 'danger';
    }
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.productToDeleteId = id;
    this.showDeleteDialog = true;
  }

  updateDialog(event: Event, id: string) {
    event.stopPropagation();
    this.productToUpdateId = id;
    this.showUpdateDialog = true;
    this.loadProductById();
  }

  supplyDialog(event: Event, id: string) {
    event.stopPropagation();
    this.productToAddSuplyForItId = id;
    this.showSupplyDialog = true;
  }

  pickSaleDateDialog(event: Event) {
    event.stopPropagation();
    this.showPickSaleDateDialog = true;
  }

  saleDialog(event: Event, id: string, productPrice: number) {
    event.stopPropagation();
    this.productToSaleId = id;

    if (this.alreadyAddedProduct(id)) {
      this.quantityToSale.set(this.alreadyAddedProduct(id)?.quantity!);
    } else {
      this.quantityToSale.set(1);
    }

    this.productPrice.set(productPrice);
    this.changePriceBasedQuantity();

    this.showSaleDialog = true;
  }

  onDeleteConfirmed() {
    if (!this.productToDeleteId) return;

    this.deleteLoading = true;
    this._productsService.deleteProduct(this.productToDeleteId).subscribe({
      next: () => {
        this.products.set(
          this.products().filter(
            (product) => product._id !== this.productToDeleteId
          )
        );
        this.showAlert('success', 'Confirmé', 'Produit supprimé avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteProduct():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de la produit!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  onUpdateConfirmed() {
    if (this.updateProductFormData.invalid) {
      this.updateProductFormData.markAllAsDirty();
      this.updateProductFormData.markAllAsTouched();
    } else {
      const formData = new FormData();
      formData.set('image', this.imageFile!);
      formData.set('name', this.name.value);
      formData.set('categoryId', this.category.value);
      formData.set('unitPrice', this.unitPrice.value);
      formData.set('discountRule[minQty]', this.minQty.value);
      formData.set('discountRule[percent]', this.percent.value);
      formData.set('globalDiscountPercent', this.globalDiscountPercent.value);
      this.updateProduct(formData);
    }
  }

  onSupplyConfirmed() {
    if (this.supplyFormData.invalid) {
      this.supplyFormData.markAllAsDirty();
      this.supplyFormData.markAllAsTouched();
    } else {
      this._suppliesService.supplies.update((current) => [
        ...current,
        {
          productId: this.productToAddSuplyForItId!,
          quantity: this.quantity.value,
          expiringAt: dateFormat(this.expiringAt.value),
        },
      ]);
      this.cleanupSupplyDialog();
    }
  }

  onPickSaleDateConfirmed() {
    if (this.saleDate() === '') {
      return this.showAlert(
        'error',
        'Un champ obligatoire',
        "Quand il veut c'est obligatoire!"
      );
    }
    this._salesService.sale.set({
      date: dateFormat(this.saleDate()),
      items: [],
    });
    this.cleanupPickSaleDateDialog();
    this.showAlert('success', 'Ajouter une vente', 'vente ajoutée avec succès');
  }

  onSaleConfirmed() {
    const qty = this.quantityToSale();
    if (qty <= 0) {
      return this.showAlert(
        'error',
        'Un champ obligatoire',
        'La quantité à vendre doit être un nombre positif'
      );
    }

    this._salesService.sale.update((current) => {
      // defensive
      const items = current?.items ?? [];

      // see if it’s already there
      const exists = items.find((i) => i.productId === this.productToSaleId);

      let newItems: typeof items;
      if (exists) {
        // map‑over, update only that one
        newItems = items.map((i) =>
          i.productId === this.productToSaleId ? { ...i, quantity: qty } : i
        );
      } else {
        // not found → append a brand‑new entry
        newItems = [
          ...items,
          {
            productId: this.productToSaleId!,
            soldBy: 'carton',
            quantity: qty,
          },
        ];
      }

      return {
        ...current!,
        items: newItems,
      };
    });

    this.cleanupSaleDialog();
    this.showAlert(
      'success',
      'Ajouter un produit',
      'Produit ajouté / mis à jour avec succès'
    );
  }

  addBulkSupply() {
    this.addSupplyLoading = true;
    this._suppliesService.addBulkSupply().subscribe({
      next: () => {
        this.addSupplyLoading = false;
        this.loadProducts(this.currentPage());
        this._suppliesService.supplies.set([]);
        this.showAlert(
          'success',
          "Ajouter l'approvisionnement en vrac",
          "l'approvisionnement en vrac a été ajouté avec succès"
        );
      },
      error: (mistake) => {
        this.addSupplyLoading = false;
        this._suppliesService.supplies.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message ||
            "Échec de l'ajout d'un approvisionnement en vrac!"
        );
      },
    });
  }

  addNewSale(path: string) {
    if (this._salesService.sale()!.items?.length! <= 0) {
      return this.showAlert(
        'error',
        'Éléments obligatoires',
        'sélectionnez certains produits pour ajouter une nouvelle vente!'
      );
    }
    this.addSaleLoading = true;
    this._salesService.createSale(path).subscribe({
      next: () => {
        this.addSaleLoading = false;
        this._salesService.sale.set(null);
        this.saleDate.set('');
        this.loadProducts(this.currentPage());
        this.showAlert(
          'success',
          'Créer une nouvelle vente',
          'Nouvelle vente créée avec succès'
        );
      },
      error: (mistake) => {
        this.addSaleLoading = false;
        this._salesService.sale.set(null);
        this.saleDate.set('');
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || "Échec de la création d'une nouvelle vente!"
        );
      },
    });
  }

  addNewOrder() {
    if (this._salesService.sale()!.items?.length! <= 0) {
      return this.showAlert(
        'error',
        'Éléments obligatoires',
        'sélectionnez certains produits pour ajouter une nouvelle commande!'
      );
    }
    this.addOrderLoading = true;
    this._ordersService.createOrder().subscribe({
      next: () => {
        this.addOrderLoading = false;
        this._salesService.sale.set(null);
        this.showAlert(
          'success',
          'Créer une nouvelle vente',
          'Nouvelle commande créée avec succès'
        );
      },
      error: (mistake) => {
        this.addOrderLoading = false;
        this._salesService.sale.set(null);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message ||
            "Échec de la création d'une nouvelle commande!"
        );
      },
    });
  }

  changePriceBasedQuantity() {
    this.salePrice.set(this.productPrice() * this.quantityToSale());
  }

  alreadyAddedProduct(id: string) {
    return this._salesService
      .sale()
      ?.items.find((item) => item.productId === id);
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
    this.loadCategories();
    const category =
      this._activatedRoute.snapshot.queryParamMap.get('category');
    if (category) this.categoryFilter.set(category);
  }

  private initUpdateProductFormControls(): void {
    this.image = new FormControl('');
    this.name = new FormControl('', [Validators.required]);
    this.category = new FormControl('', [Validators.required]);
    this.unitPrice = new FormControl('', [
      Validators.required,
      Validators.min(1),
    ]);
    this.minQty = new FormControl('', [Validators.required, Validators.min(1)]);
    this.percent = new FormControl(0, [Validators.min(0), Validators.max(100)]);
    this.globalDiscountPercent = new FormControl(0, [
      Validators.min(0),
      Validators.max(100),
    ]);
  }

  private initUpdateProductFormGroup(): void {
    this.updateProductFormData = new FormGroup({
      image: this.image,
      name: this.name,
      category: this.category,
      unitPrice: this.unitPrice,
      minQty: this.minQty,
      percent: this.percent,
      globalDiscountPercent: this.globalDiscountPercent,
    });
  }

  private initSupplyFormControls(): void {
    this.expiringAt = new FormControl('', [Validators.required]);
    this.quantity = new FormControl(1, [Validators.min(1)]);
  }

  private initSupplyFormGroup(): void {
    this.supplyFormData = new FormGroup({
      expiringAt: this.expiringAt,
      quantity: this.quantity,
    });
  }

  private updateProduct(formData: FormData) {
    if (!this.productToUpdateId) return;

    this.updateLoading = true;
    this._productsService
      .updateProduct(this.productToUpdateId, formData)
      .subscribe({
        next: () => {
          this.showAlert(
            'success',
            'Confirmé',
            'Produit mis à jour avec succès'
          );
          this.loadProducts(this.currentPage());
          this.cleanupUpdateDialog();
        },
        error: (mistake) => {
          console.log('deleteProduct():', mistake);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'Échec de la mise à jour du produit!'
          );
          this.cleanupUpdateDialog();
        },
      });
  }

  private loadProductById() {
    if (!this.productToUpdateId) return;

    this._productsService.getProductById(this.productToUpdateId).subscribe({
      next: (product) => {
        this.updateProductFormData.setValue({
          image: '',
          name: product.name,
          category: product.categoryId._id,
          unitPrice: product.unitPrice,
          minQty: product.discountRule.minQty,
          percent: product.discountRule.percent,
          globalDiscountPercent: product.globalDiscountPercent || 0,
        });
      },
      error: (mistake) => {
        console.log('loadProductById():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement du produit'
        );
      },
    });
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.productToDeleteId = null;
  }

  private cleanupUpdateDialog() {
    this.updateLoading = false;
    this.showUpdateDialog = false;
    this.productToUpdateId = null;
    this.updateProductFormData.reset();
  }

  private cleanupSupplyDialog() {
    this.showSupplyDialog = false;
    this.productToAddSuplyForItId = null;
    this.supplyFormData.reset({ quantity: 1 });
  }

  private cleanupPickSaleDateDialog() {
    this.showPickSaleDateDialog = false;
  }

  private cleanupSaleDialog() {
    this.showSaleDialog = false;
    this.productToSaleId = null;
  }

  private loadProducts(
    page: number,
    categoryId?: string,
    productName?: string
  ) {
    this.loadingProducts = true;
    this._productsService.getProducts(page, categoryId, productName).subscribe({
      next: ({ data, meta }) => {
        this.loadingProducts = false;
        this.products.set(data);
        this.totalProducts.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadProducts():', mistake);
        this.loadingProducts = false;
        this.products.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des produits'
        );
      },
    });
  }

  private loadCategories() {
    this.loadingCategories = true;
    this._categoriesService.getCategories().subscribe({
      next: ({ data }) => {
        this.loadingCategories = false;
        this.categories.set(data);
      },
      error: (mistake) => {
        console.log('loadCategories():', mistake);
        this.loadingCategories = false;
        this.categories.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des catégories'
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
