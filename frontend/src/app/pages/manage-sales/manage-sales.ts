import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ConfirmationService,
  MenuItem,
  MenuItemCommandEvent,
  MessageService,
} from 'primeng/api';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { ISale } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales.service';
import { DatePicker } from 'primeng/datepicker';
import { dateFormat } from '../../shared/utils/date-format';
import { Menu } from 'primeng/menu';
import { TReturn } from '../../shared/types/sale.type';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { NgIf } from '@angular/common';
import { IUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manage-sales',
  imports: [
    FormsModule,
    TableModule,
    PaginatorModule,
    Dialog,
    ToastModule,
    ButtonModule,
    InputTextModule,
    DatePicker,
    Menu,
    InputNumber,
    Select,
    NgIf,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-sales.html',
  styleUrl: './manage-sales.scss',
})
export class ManageSales {
  loadingSales = false;
  sales = signal<ISale[] | []>([]);
  totalSales = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = 10;

  createLoading = false;

  private saleToDeleteId: string | null = null;
  showDeleteDialog = false;
  deleteLoading = false;

  dateDu = signal<string>('');
  dateAu = signal<string>('');

  items = signal<ISale['items']>([]);
  saleNumber = signal<string>('');
  showItemsDialog = false;

  menuItems: MenuItem[] | undefined;

  sale = signal<ISale | null>(null);
  updateLoading = false;

  showChangeDeliveryStatusDialog = false;
  showUpdateReturnDialog = false;
  showUpdateReturnGlobalDialog = false;
  showUpdatePaymentDialog = false;

  returnedQuantities: Record<string, number> = {};
  returnGlobal = signal<number>(0);

  returnedItems = signal<TReturn['returnItems']>([]);

  paymentFilter = signal<'crédit' | 'partiel' | 'totalité' | ''>('');
  amountPaid = signal<number>(0);

  userType!: IUser['role'];

  constructor(
    private readonly _messageService: MessageService,
    private readonly _salesService: SalesService,
    private readonly _authService: AuthService
  ) {}

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
    this.loadSales(10, event.page! + 1, this.dateDu(), this.dateAu());
  }

  formatWantedDate(date: any) {
    return dateFormat(date as string);
  }

  deleteConfirm(event: Event, id: string) {
    event.stopPropagation();
    this.saleToDeleteId = id;
    this.showDeleteDialog = true;
  }

  itemsDialog(event: Event, id: string) {
    event.stopPropagation();
    this.showItemsDialog = true;
    const findSale = this.sales().find((sale) => sale._id === id);
    if (findSale) {
      this.saleNumber.set(findSale.saleNumber);
      this.items.set(findSale.items);
    }
  }

  onDeleteConfirmed() {
    if (!this.saleToDeleteId) return;
    this.deleteLoading = true;
    this._salesService.deleteSale(this.saleToDeleteId).subscribe({
      next: () => {
        this.sales.update((current) =>
          current.filter((sale) => sale._id !== this.saleToDeleteId)
        );
        this.showAlert('success', 'Confirmé', 'Vente supprimée avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteSale():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de la Vente!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  dateBasedFilter() {
    if (!this.dateDu() || !this.dateAu()) {
      return this.showAlert(
        'error',
        'Champ obligatoire',
        'Vous devez sélectionner la date du au!'
      );
    }
    this.loadSales(10, 1, this.dateDu(), this.dateAu());
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
    this.menuItems = [
      {
        label: 'Options',
        items: [
          {
            label: 'Vente',
            icon: 'pi pi-list-check',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showChangeDeliveryStatusDialog = true;
            },
          },
          {
            label: 'Retour Sur BL',
            icon: 'pi pi-sync',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showUpdateReturnDialog = true;
              this.returnedQuantities = {};
              this.returnedItems.set([]);
            },
          },
          {
            label: 'Retour Global',
            icon: 'pi pi-refresh',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showUpdateReturnGlobalDialog = true;
            },
          },
          {
            label: 'Paiement',
            icon: 'pi pi-money-bill',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showUpdatePaymentDialog = true;
              this.paymentFilter.set('');
              this.amountPaid.set(0);
            },
          },
        ],
      },
    ];
  }

  loadSale(event: Event, saleId: string) {
    event.stopPropagation();
    const findSale = this.sales().find((sale) => sale._id === saleId);
    if (findSale) this.sale.set(findSale);
  }

  updateDeliveryStatus(
    deliveryStatus: 'ordered' | 'delivered' | 'notDelivered'
  ) {
    this.updateSale(deliveryStatus);
    this.cleanupDeliveryStatusDialog();
  }

  updateReturn() {
    this.updateSale(undefined, { returnItems: this.returnedItems() });
    this.cleanupUpdateReturnDialog();
  }

  updateGlobalReturn() {
    this.updateSale(undefined, undefined, this.returnGlobal());
    this.cleanupUpdateReturnGlobalDialog();
  }

  onMethodPaymentChange(event: 'crédit' | 'partiel' | 'totalité' | '') {
    switch (event) {
      case 'crédit':
      case 'partiel':
      default:
        this.amountPaid.set(0);
        break;
      case 'totalité':
        this.amountPaid.set(this.sale()?.netAmount!);
        break;
    }
  }

  updatePayment() {
    if (!this.paymentFilter()) {
      return this.showAlert(
        'error',
        'Le champ obligatoire',
        'Le mode de paiement est obligatoire!'
      );
    }
    this.updateSale(undefined, undefined, undefined, this.amountPaid());
    this.cleanupUpdatePaymentDialog();
  }

  updateQuantity(productId: string) {
    this.sale.update((current) => {
      const items = current!.items.map((item) => {
        if (item.productId._id === productId) {
          return {
            ...item,
            quantity: item.quantity - this.returnedQuantities[productId],
          };
        } else {
          return item;
        }
      });
      return { ...current!, items };
    });
  }

  saveReturnedItems(productId: string) {
    const qty = this.returnedQuantities[productId] || 0;
    console.log(this.returnedQuantities[productId]);
    if (qty <= 0) {
      return this.showAlert(
        'error',
        'Quantité retournée',
        "La quantité retournée doit être d'au moins 1"
      );
    }
    this.returnedItems.update((current) => [
      ...current,
      { productId, soldBy: 'carton', quantity: qty },
    ]);
    this.updateQuantity(productId);
    this.returnedQuantities[productId] = 0;
    this.showAlert(
      'success',
      'Quantité retournée',
      'Quantité retournée sauvegardée avec succès'
    );
  }

  translatedDeliveryStatus(
    deliveryStatus: 'ordered' | 'delivered' | 'notDelivered'
  ) {
    switch (deliveryStatus) {
      case 'ordered':
        return 'Ordonné';
      case 'delivered':
        return 'Livré';
      case 'notDelivered':
        return 'Non livré';
      default:
        return 'Unknown';
    }
  }

  calcQTTL(productId: string, quantity: number) {
    const targetItem = this.sale()?.return.returnItems.find(
      (returnItem) => returnItem.productId._id === productId
    );
    if (targetItem) return quantity - targetItem?.quantity;
    return quantity;
  }

  calcTotalAmount(productId: string, total: number) {
    const targetItem = this.sale()?.return.returnItems.find(
      (returnItem) => returnItem.productId._id === productId
    );
    if (targetItem) return targetItem?.total;
    return total;
  }

  private loadSales(
    limit: number,
    page: number,
    dateDu?: string,
    dateAu?: string
  ) {
    this.loadingSales = true;
    this._salesService.getSales(limit, page, dateDu, dateAu).subscribe({
      next: ({ data, meta }) => {
        this.loadingSales = false;
        this.sales.set(data);
        this.totalSales.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadSales():', mistake);
        this.loadingSales = false;
        this.sales.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des ventes'
        );
      },
    });
  }

  private updateSale(
    deliveryStatus?: 'ordered' | 'delivered' | 'notDelivered',
    retour?: TReturn,
    returnGlobal?: number,
    amountPaid?: number
  ) {
    this.updateLoading = true;
    this._salesService
      .updateSale(
        this.sale()?._id!,
        deliveryStatus,
        retour,
        returnGlobal,
        amountPaid
      )
      .subscribe({
        next: (sale) => {
          console.log('updated sale:', sale);
          this.updateLoading = false;
          this.sales.update((currentSales) => {
            return currentSales.map((currentSale) => {
              if (sale._id === currentSale._id) {
                return {
                  ...currentSale,
                  deliveryStatus: sale.deliveryStatus,
                  return: {
                    returnTotal: sale.return.returnTotal,
                    returnItems: sale.return.returnItems,
                  },
                  returnGlobal: sale.returnGlobal,
                  netAmount: sale.netAmount,
                  amountPaid: sale.amountPaid,
                };
              } else {
                return currentSale;
              }
            });
          });
          this.showAlert(
            'success',
            'Mise à jour réussie',
            'Informations mises à jour avec succès!'
          );
        },
        error: (mistake) => {
          console.log('updateSale():', mistake);
          this.updateLoading = false;
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'Échec de la mise à jour des informations!'
          );
        },
      });
  }

  private cleanupDeleteDialog() {
    this.deleteLoading = false;
    this.showDeleteDialog = false;
    this.saleToDeleteId = null;
  }

  private cleanupDeliveryStatusDialog() {
    this.showChangeDeliveryStatusDialog = false;
    this.sale.set(null);
    console.log('cleanup...');
  }

  private cleanupUpdateReturnDialog() {
    this.showUpdateReturnDialog = false;
    this.sale.set(null);
    this.returnedQuantities = {};
    this.returnedItems.set([]);
  }

  private cleanupUpdateReturnGlobalDialog() {
    this.showUpdateReturnGlobalDialog = false;
    this.sale.set(null);
    this.returnGlobal.set(0);
  }

  private cleanupUpdatePaymentDialog() {
    this.showUpdatePaymentDialog = false;
    this.sale.set(null);
    this.paymentFilter.set('');
    this.amountPaid.set(0);
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
