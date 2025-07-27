import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthHeader } from '../../components/auth-header/auth-header';
import { TMenuItem } from '../../shared/types/menu-item.type';

@Component({
  selector: 'app-delivery-layout',
  imports: [RouterOutlet, AuthHeader],
  templateUrl: './delivery-layout.html',
  styleUrl: './delivery-layout.scss',
})
export class DeliveryLayout {
  sidebarItems!: TMenuItem[];

  ngOnInit() {
    this.sidebarItems = [
      {
        href: '/delivery/delivery-page',
        icon: 'pi pi-truck',
        label: 'Delivery page',
      },
      {
        href: '/delivery/change-password',
        icon: 'pi pi-lock',
        label: 'Changer le mot de passe',
      },
      {
        href: '/delivery/manage-products',
        icon: 'pi pi-shopping-bag',
        label: 'Tous les produits',
      },
      {
        href: '/delivery/manage-clients',
        icon: 'pi pi-users',
        label: 'Tous les clients',
      },
      {
        href: '/delivery/manage-sales',
        icon: 'pi pi-shop',
        label: 'Gérer les ventes',
      },
      {
        href: '/delivery/manage-orders',
        icon: 'pi pi-megaphone',
        label: 'Gérer les commandes',
      },
    ];
  }
}
