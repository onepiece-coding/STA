import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoriesService } from '../../core/services/categories.service';
import { TableModule } from 'primeng/table';
import { ICategory } from '../../core/models/categories.model';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-categories',
  imports: [
    FormsModule,
    TableModule,
    PaginatorModule,
    Dialog,
    ToastModule,
    ButtonModule,
    InputTextModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-categories.html',
  styleUrl: './manage-categories.scss',
})
export class ManageCategories {
  loading = false;
  categories = signal<ICategory[] | []>([]);
  totalCategories = signal<number>(0);
  nameSearch = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  createLoading = false;

  private categoryToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  constructor(
    private readonly _messageService: MessageService,
    private readonly _categoriesService: CategoriesService,
    private readonly _router: Router
  ) {
    effect(() => {
      const page = this.currentPage();
      const categoryName = this.nameSearch();
      this.loadCategories(10, page, categoryName);
    });
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.categoryToDeleteId = id;
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed() {
    if (!this.categoryToDeleteId) return;
    this.deleteLoading = true;
    this._categoriesService.deleteCategory(this.categoryToDeleteId).subscribe({
      next: () => {
        this.categories.set(
          this.categories().filter((cat) => cat._id !== this.categoryToDeleteId)
        );
        this.showAlert('success', 'Confirmé', 'Catégorie supprimé avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteCategory():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de la catégorie!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  onSubmit() {
    if (this.nameSearch() === '') {
      this.showAlert(
        'error',
        'Le champ obligatoire',
        'Le nom de la catégorie est obligatoire!'
      );
    } else {
      this.createLoading = true;
      this.createCategory(this.nameSearch());
    }
  }

  navigateWithQuery(category: string) {
    this._router.navigate(['/admin/manage-products'], {
      queryParams: { category },
    });
  }

  private createCategory(categoryName: string) {
    this._categoriesService.createCategory(categoryName).subscribe({
      next: () => {
        this.createLoading = false;
        this.nameSearch.set('');
        this.showAlert(
          'success',
          'Créer une catégorie',
          'La catégorie a été créée'
        );
      },
      error: (mistake) => {
        console.log('createCategory():', mistake);
        this.createLoading = false;
        this.nameSearch.set('');
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec de la création de la catégorie!'
        );
      },
    });
  }

  private loadCategories(limit: number, page: number, categoryName?: string) {
    this.loading = true;
    this._categoriesService.getCategories(limit, page, categoryName).subscribe({
      next: ({ data, meta }) => {
        this.loading = false;
        this.categories.set(data);
        this.totalCategories.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadCategories():', mistake);
        this.loading = false;
        this.categories.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des catégories'
        );
      },
    });
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.categoryToDeleteId = null;
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
