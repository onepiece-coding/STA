import { Component } from '@angular/core';
import { TMenuItem } from '../../shared/types/menu-item.type';
import { RouterOutlet } from '@angular/router';
import { AuthHeader } from '../../components/auth-header/auth-header';

@Component({
  selector: 'app-instant-layout',
  imports: [RouterOutlet, AuthHeader],
  templateUrl: './instant-layout.html',
  styleUrl: './instant-layout.scss',
})
export class InstantLayout {
  sidebarItems!: TMenuItem[];

  ngOnInit() {
    this.sidebarItems = [
      {
        href: '/instant/instant-page',
        icon: 'pi pi-instagram',
        label: 'Instant Page',
      },
      {
        href: '/instant/change-password',
        icon: 'pi pi-lock',
        label: 'Changer le mot de passe',
      },
      {
        href: '/instant/all-products',
        icon: 'pi pi-shopping-bag',
        label: 'Tous les produits',
      },
      {
        href: '/instant/discounted-products',
        icon: 'pi pi-minus-circle',
        label: 'Les promotions',
      },
      {
        href: '/instant/all-sales',
        icon: 'pi pi-shop',
        label: 'Toutes les ventes',
      },
      {
        href: '/instant/manage-stats',
        icon: 'pi pi-chart-bar',
        label: 'Gérer les statistiques',
      },
    ];
  }
}
