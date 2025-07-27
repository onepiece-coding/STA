import { Component, inject, Input } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TMenuItem } from '../../shared/types/menu-item.type';

@Component({
  selector: 'app-auth-header',
  imports: [DrawerModule, ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './auth-header.html',
  styleUrl: './auth-header.scss',
})
export class AuthHeader {
  authService = inject(AuthService);
  visible: boolean = false;

  @Input({ required: true }) sidebarItems!: TMenuItem[];

  translatedRole() {
    switch (this.authService.currentUserSignal()?.role) {
      case 'admin':
        return 'Directeur';
      case 'delivery':
        return 'Livreur';
      case 'seller':
        return 'Vendeur';
      case 'instant':
        return 'Colporteur';
      default:
        return 'Inconnu';
    }
  }

  hideSidebar() {
    this.visible = false;
  }
}
