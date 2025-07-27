import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ProductsService } from '../../core/services/products.service';
import { IProduct } from '../../core/models/product.model';
import { DataView } from 'primeng/dataview';
import { Tag } from 'primeng/tag';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discounted-products',
  imports: [
    FormsModule,
    PaginatorModule,
    ToastModule,
    ButtonModule,
    DataView,
    Tag,
    CommonModule,
  ],
  providers: [MessageService],
  templateUrl: './discounted-products.html',
  styleUrl: './discounted-products.scss',
})
export class DiscountedProducts {
  loadingDiscountedProducts = false;
  discountedProducts = signal<IProduct[]>([]);
  totalDiscountedProducts = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = 10;

  constructor(
    private readonly _productsService: ProductsService,
    private readonly _messageService: MessageService
  ) {
    effect(() => {
      const page = this.currentPage();
      this.loadDiscountedProducts(page);
    });
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

  private loadDiscountedProducts(page: number) {
    this.loadingDiscountedProducts = true;
    this._productsService.getDiscountedProducts(page).subscribe({
      next: ({ data, meta }) => {
        this.loadingDiscountedProducts = false;
        this.discountedProducts.set(data);
        this.totalDiscountedProducts.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadDiscountedProducts():', mistake);
        this.loadingDiscountedProducts = false;
        this.discountedProducts.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des produits'
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
