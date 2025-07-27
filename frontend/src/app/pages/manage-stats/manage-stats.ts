import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { UsersService } from '../../core/services/users.service';
import { IUser } from '../../core/models/user.model';
import { MessageService } from 'primeng/api';
import { StatsService } from '../../core/services/stats.service';
import { TStat } from '../../shared/types/stat.type';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manage-stats',
  standalone: true,
  imports: [DatePicker, FormsModule, ButtonModule, Select, Toast],
  providers: [MessageService],
  templateUrl: './manage-stats.html',
  styleUrl: './manage-stats.scss',
})
export class ManageStats {
  loadingSellers = false;
  sellers = signal<IUser[]>([]);

  dateDu = signal<string>('');
  dateAu = signal<string>('');
  seller = signal<string>('');

  loadingStats = false;
  stats = signal<TStat | null>(null);

  userType!: IUser['role'];

  constructor(
    private readonly _statsService: StatsService,
    private readonly _usersService: UsersService,
    private readonly _messageService: MessageService,
    private readonly _authService: AuthService
  ) {
    effect(() => {
      const from = this.dateDu();
      const to = this.dateAu();
      const seller = this.seller();
      this.loadStats(from, to, seller);
    });
  }

  ngOnInit() {
    this.userType = this._authService.currentUserSignal()?.role!;
    if (this.userType === 'admin') {
      console.log('LOAD SELLERS');
      this.loadSellers();
    }
  }

  private loadStats(from?: string, to?: string, seller?: string) {
    this.loadingStats = true;
    this._statsService.getStats(from, to, seller).subscribe({
      next: (sats) => {
        this.loadingStats = false;
        this.stats.set(sats);
      },
      error: (mistake) => {
        console.log('loadProducts():', mistake);
        this.loadingStats = false;
        this.stats.set(null);
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'échec du chargement des produits'
        );
      },
    });
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

  private showAlert(severity: string, summary: string, detail: string) {
    this._messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }
}
