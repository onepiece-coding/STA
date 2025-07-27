import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthHeader } from '../../components/auth-header/auth-header';
import { TMenuItem } from '../../shared/types/menu-item.type';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AuthHeader],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  sidebarItems!: TMenuItem[];

  ngOnInit() {
    this.sidebarItems = [
      {
        href: '/admin/admin-page',
        icon: 'pi pi-android',
        label: 'Admin Page',
      },
      {
        href: '/admin/change-password',
        icon: 'pi pi-lock',
        label: 'Changer le mot de passe',
      },
      {
        href: '/admin/manage-categories',
        icon: 'pi pi-bars',
        label: 'Gérer les catégories',
      },
      {
        href: '/admin/create-product',
        icon: 'pi pi-plus-circle',
        label: 'Nouveau produit',
      },
      {
        href: '/admin/manage-products',
        icon: 'pi pi-shopping-bag',
        label: 'Gérer les produits',
      },
      {
        href: '/admin/discounted-products',
        icon: 'pi pi-minus-circle',
        label: 'Promotions',
      },
      {
        href: '/admin/expiring-soon',
        icon: 'pi pi-cart-arrow-down',
        label: 'Alertes - les produits expirés',
      },
      {
        href: '/admin/low-stock',
        icon: 'pi pi-bell',
        label: 'Alertes - faible stock',
      },
      {
        href: '/admin/manage-cities',
        icon: 'pi pi-map',
        label: 'Gérer les villes',
      },
      {
        href: '/admin/manage-users',
        icon: 'pi pi-user',
        label: 'Gérer les utilisateurs',
      },
      {
        href: '/admin/manage-stats',
        icon: 'pi pi-chart-bar',
        label: 'Gérer les statistiques',
      },
    ];
  }
}
