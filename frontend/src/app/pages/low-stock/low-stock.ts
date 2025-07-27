import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { SuppliesService } from '../../core/services/supplies.service';
import { TAlert } from '../../shared/types/alert.type';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-low-stock',
  imports: [
    FormsModule,
    PaginatorModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    TableModule,
  ],
  providers: [MessageService],
  templateUrl: './low-stock.html',
  styleUrl: './low-stock.scss',
})
export class LowStock {
  loading = false;
  threshold = signal<number>(10);
  alerts = signal<TAlert[]>([]);

  constructor(
    private readonly _suppliesService: SuppliesService,
    private readonly _messageService: MessageService
  ) {}

  loadLowStockAlerts(threshold?: number) {
    this.loading = true;
    this._suppliesService.lowStockAlerts(threshold).subscribe({
      next: (alerts) => {
        this.loading = false;
        this.alerts.set(alerts);
        console.log(alerts);
      },
      error: (mistake) => {
        console.log('loadLowStockAlerts():', mistake);
        this.loading = false;
        this.alerts.set([]);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Échec du chargement des alertes'
        );
      },
    });
  }

  ngOnInit() {
    this.loadLowStockAlerts(10);
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
