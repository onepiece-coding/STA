import { Component, effect, signal } from '@angular/core';
import { IUser } from '../../core/models/user.model';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { UsersService } from '../../core/services/users.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-all-delivery',
  imports: [
    FormsModule,
    TableModule,
    Popover,
    ButtonModule,
    Paginator,
    InputTextModule,
  ],
  providers: [MessageService],
  templateUrl: './all-delivery.html',
  styleUrl: './all-delivery.scss',
})
export class AllDelivery {
  nameSearch = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = 10;

  loadingDeliveries = false;
  deliveries = signal<IUser[]>([]);
  totalDeliveries = signal<number>(0);

  constructor(
    private readonly _usersService: UsersService,
    private readonly _messageService: MessageService
  ) {
    effect(() => {
      const page = this.currentPage();
      const username = this.nameSearch();
      this.loadDeliveries('delivery', page, username);
    });
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set(event.page! + 1);
  }

  private loadDeliveries(userType: string, page: number, username?: string) {
    this.loadingDeliveries = true;
    this._usersService.getUsers(userType, page, username).subscribe({
      next: ({ data, meta }) => {
        this.loadingDeliveries = false;
        this.deliveries.set(data);
        this.totalDeliveries.set(meta.total);
      },
      error: (mistake) => {
        console.log('loadUsers():', mistake);
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
