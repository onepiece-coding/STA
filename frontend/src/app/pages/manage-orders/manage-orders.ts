import { Component, effect, signal } from '@angular/core';
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
import { DatePicker } from 'primeng/datepicker';
import { dateFormat } from '../../shared/utils/date-format';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import { IUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { IOrder } from '../../core/models/order.model';
import { OrdersService } from '../../core/services/orders.service';
import { SalesService } from '../../core/services/sales.service';
import { Router } from '@angular/router';

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
    Select,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-orders.html',
  styleUrl: './manage-orders.scss',
})
export class ManageOrders {
  loadingOrders = false;
  orders = signal<IOrder[] | []>([]);
  totalOrders = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = 10;

  showDeleteDialog = false;
  deleteLoading = false;

  dateDu = signal<string>('');
  dateAu = signal<string>('');
  statusFilter = signal<'pending' | 'done' | 'cancelled' | ''>('');

  items = signal<IOrder['items']>([]);
  showItemsDialog = false;

  menuItems: MenuItem[] | undefined;

  order = signal<IOrder | null>(null);
  updateLoading = false;

  showChangeOrderStatusDialog = false;
  orderStatus = signal<'pending' | 'done' | 'cancelled'>('pending');

  wantedDate = signal<string>('');
  showSaleDialog = false;

  updatedWantedDate = signal<Date>(this.order()?.wantedDate!);

  userType!: IUser['role'];

  constructor(
    private readonly _messageService: MessageService,
    private readonly _ordersService: OrdersService,
    private readonly _salesService: SalesService,
    private readonly _authService: AuthService,
    private readonly _router: Router
  ) {
    effect(() => {
      const page = this.currentPage();
      const from = this.dateDu();
      const to = this.dateAu();
      const status = this.statusFilter();
      this.loadOrders(10, page, from, to, status);
    });
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  formatWantedDate(date: any) {
    return dateFormat(date as string);
  }

  itemsDialog(event: Event, id: string) {
    event.stopPropagation();
    this.showItemsDialog = true;
    const findOrder = this.orders().find((sale) => sale._id === id);
    if (findOrder) {
      this.items.set(findOrder.items);
    }
  }

  onDeleteConfirmed() {
    if (!this.order()?._id) return;
    this.deleteLoading = true;
    this._ordersService.deleteOrder(this.order()?._id!).subscribe({
      next: () => {
        this.orders.update((current) =>
          current.filter((order) => order._id !== this.order()?._id)
        );
        this.showAlert('success', 'Confirmé', 'Commande supprimée avec succès');
        this.cleanupDeleteDialog();
      },
      error: (mistake) => {
        console.log('deleteOrder():', mistake);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec de la suppression de la Commande!'
        );
        this.cleanupDeleteDialog();
      },
    });
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
    this.menuItems = [
      {
        label: 'Options',
        items: [
          {
            label: 'Modifier',
            icon: 'pi pi-pen-to-square',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showChangeOrderStatusDialog = true;
            },
          },
          {
            label: 'Supprimer',
            icon: 'pi pi-trash',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showDeleteDialog = true;
            },
          },
          {
            label: 'Vente',
            icon: 'pi pi-plus-circle',
            command: (event: MenuItemCommandEvent) => {
              event.originalEvent?.stopPropagation();
              this.showSaleDialog = true;
            },
            visible: this.userType === 'seller',
          },
        ],
      },
    ];
  }

  loadOrder(event: Event, orderId: string) {
    event.stopPropagation();
    const findOrder = this.orders().find((order) => order._id === orderId);
    if (findOrder) {
      this.order.set(findOrder);
      this.orderStatus.set(findOrder.status);
    }
  }

  updateOrderStatus() {
    this.updateOrder(this.orderStatus(), this.updatedWantedDate());
    this.cleanupOrderStatusDialog();
  }

  translatedOrderStatus(orderStatus: 'pending' | 'done' | 'cancelled') {
    switch (orderStatus) {
      case 'pending':
        return 'En Attente';
      case 'done':
        return 'Confirmé';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Inconnu';
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
      clientId: this.order()?.client?._id,
      date: dateFormat(this.wantedDate()),
      // @ts-ignore
      items: this.order()?.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        soldBy: item.soldBy,
      })),
    });
    this.cleanupSaleDialog();
    this.showAlert('success', 'Ajouter une vente', 'vente ajoutée avec succès');
    this._router.navigateByUrl(`/seller/manage-products`);
  }

  private loadOrders(
    limit: number,
    page: number,
    dateDu?: string,
    dateAu?: string,
    status?: 'pending' | 'done' | 'cancelled' | ''
  ) {
    this.loadingOrders = true;
    this._ordersService
      .getOrders(limit, page, dateDu, dateAu, status)
      .subscribe({
        next: ({ data, meta }) => {
          console.log(data);
          this.loadingOrders = false;
          this.orders.set(data);
          this.totalOrders.set(meta.total);
        },
        error: (mistake) => {
          console.log('loadOrders():', mistake);
          this.loadingOrders = false;
          this.orders.set([]);
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'échec du chargement des ordres'
          );
        },
      });
  }

  private updateOrder(
    orderStatus?: 'pending' | 'done' | 'cancelled',
    wantedDate?: Date
  ) {
    this.updateLoading = true;
    this._ordersService
      .updateOrder(this.order()?._id!, orderStatus, wantedDate)
      .subscribe({
        next: (order) => {
          this.updateLoading = false;
          this.orders.update((currentOrders) => {
            return currentOrders.map((currentOrder) => {
              if (order._id === currentOrder._id) {
                return {
                  ...currentOrder,
                  status: order.status,
                };
              } else {
                return currentOrder;
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
          console.log('updateOrder():', mistake);
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
    this.order.set(null);
  }

  private cleanupOrderStatusDialog() {
    this.showChangeOrderStatusDialog = false;
    this.order.set(null);
  }

  private cleanupSaleDialog() {
    this.showSaleDialog = false;
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
