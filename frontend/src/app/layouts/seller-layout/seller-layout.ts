import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthHeader } from '../../components/auth-header/auth-header';
import { TMenuItem } from '../../shared/types/menu-item.type';

@Component({
  selector: 'app-seller-layout',
  imports: [RouterOutlet, AuthHeader],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.scss',
})
export class SellerLayout {
  sidebarItems!: TMenuItem[];

  ngOnInit() {
    this.sidebarItems = [
      {
        href: '/seller/seller-page',
        icon: 'pi pi-shop',
        label: 'Seller Page',
      },
      {
        href: '/seller/change-password',
        icon: 'pi pi-lock',
        label: 'Changer le mot de passe',
      },
      {
        href: '/seller/manage-products',
        icon: 'pi pi-shopping-bag',
        label: 'Gérer les produits',
      },
      {
        href: '/seller/discounted-products',
        icon: 'pi pi-minus-circle',
        label: 'Les promotions',
      },
      {
        href: '/seller/all-delivery',
        icon: 'pi pi-truck',
        label: 'Tous les livreurs',
      },
      {
        href: '/seller/create-client',
        icon: 'pi pi-plus-circle',
        label: 'Nouveau client',
      },
      {
        href: '/seller/manage-clients',
        icon: 'pi pi-users',
        label: 'Gérer les clients',
      },
      {
        href: '/seller/sales',
        icon: 'pi pi-shop',
        label: 'les ventes',
      },
      {
        href: '/seller/manage-orders',
        icon: 'pi pi-megaphone',
        label: 'Gérer les commandes',
      },
      {
        href: '/seller/manage-stats',
        icon: 'pi pi-chart-bar',
        label: 'Gérer les statistiques',
      },
    ];
  }
}
