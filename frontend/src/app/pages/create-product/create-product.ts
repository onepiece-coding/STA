import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { CategoriesService } from '../../core/services/categories.service';
import { ICategory } from '../../core/models/categories.model';
import { ProductsService } from '../../core/services/products.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, Toast, InputTextModule, ButtonModule, Select],
  providers: [MessageService],
  templateUrl: './create-product.html',
  styleUrl: './create-product.scss',
})
export class CreateProduct {
  private imageFile!: File | null;

  image!: FormControl;
  name!: FormControl;
  category!: FormControl;
  unitPrice!: FormControl;
  minQty!: FormControl;
  percent!: FormControl;
  createProductFormData!: FormGroup;

  createLoading = false;

  categories = signal<ICategory[]>([]);
  loadingCategories = false;

  constructor(
    private readonly _categoriesService: CategoriesService,
    private readonly _productsService: ProductsService,
    private readonly _messageService: MessageService
  ) {
    this.initFormControls();
    this.initFormGroup();
  }

  private initFormControls(): void {
    this.image = new FormControl('', [Validators.required]);
    this.name = new FormControl('', [Validators.required]);
    this.category = new FormControl('', [Validators.required]);
    this.unitPrice = new FormControl('', [
      Validators.required,
      Validators.min(1),
    ]);
    this.minQty = new FormControl('', [Validators.required, Validators.min(1)]);
    this.percent = new FormControl('', [
      Validators.min(0),
      Validators.max(100),
    ]);
  }

  private initFormGroup(): void {
    this.createProductFormData = new FormGroup({
      image: this.image,
      name: this.name,
      category: this.category,
      unitPrice: this.unitPrice,
      minQty: this.minQty,
      percent: this.percent,
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
    if (this.createProductFormData.invalid) {
      this.createProductFormData.markAllAsDirty();
      this.createProductFormData.markAllAsTouched();
    } else {
      this.createLoading = true;
      const formData = new FormData();
      formData.set('image', this.imageFile!);
      formData.set('name', this.name.value);
      formData.set('categoryId', this.category.value._id);
      formData.set('unitPrice', this.unitPrice.value);
      formData.set('discountRule[minQty]', this.minQty.value);
      formData.set('discountRule[percent]', this.percent.value);
      this.createProduct(formData);
    }
  }

  ngOnInit() {
    this.loadCategories();
  }

  private createProduct(formData: FormData) {
    this._productsService.createProduct(formData).subscribe({
      next: () => {
        this.createLoading = false;
        this.createProductFormData.reset();
        this.showAlert('success', 'Ccréer un produit', 'Le produit a été créé');
      },
      error: (mistake) => {
        console.log('createProduct():', mistake);
        this.createLoading = false;
        this.createProductFormData.reset();
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la création du produit'
        );
      },
    });
  }

  private loadCategories() {
    this.loadingCategories = true;
    this._categoriesService.getCategories().subscribe({
      next: ({ data }) => {
        this.categories.set(data);
        this.loadingCategories = false;
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
