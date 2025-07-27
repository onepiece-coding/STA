import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { SuppliesService } from '../../core/services/supplies.service';
import { TAlert } from '../../shared/types/alert.type';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-expiring-soon',
  imports: [
    FormsModule,
    PaginatorModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    DatePipe,
  ],
  providers: [MessageService],
  templateUrl: './expiring-soon.html',
  styleUrl: './expiring-soon.scss',
})
export class ExpiringSoon {
  loading = false;
  days = signal<number>(14);
  minQty = signal<number>(1);
  alerts = signal<TAlert[]>([]);

  constructor(
    private readonly _suppliesService: SuppliesService,
    private readonly _messageService: MessageService
  ) {}

  loadExpiringSoonAlerts(days?: number, minQty?: number) {
    this.loading = true;
    this._suppliesService.expiringSoonAlerts(days, minQty).subscribe({
      next: (alerts) => {
        this.loading = false;
        this.alerts.set(alerts);
        console.log(alerts);
      },
      error: (mistake) => {
        console.log('loadExpiringSoonAlerts():', mistake);
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
    this.loadExpiringSoonAlerts(14, 1);
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
