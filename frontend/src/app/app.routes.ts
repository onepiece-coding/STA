import { Routes } from '@angular/router';
import { gloablGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../app/layouts/global-layout/global-layout').then(
        (c) => c.GlobalLayout
      ),
    canActivate: [gloablGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('../app/pages/login/login').then((c) => c.Login),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('../app/layouts/admin-layout/admin-layout').then(
        (c) => c.AdminLayout
      ),
    canActivate: [authGuard('admin')],
    children: [
      { path: '', redirectTo: 'admin-page', pathMatch: 'full' },
      {
        path: 'admin-page',
        loadComponent: () =>
          import('./pages/admin-page/admin-page').then((c) => c.AdminPage),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('../app/pages/change-password/change-password').then(
            (c) => c.ChangePassword
          ),
      },
      {
        path: 'manage-categories',
        loadComponent: () =>
          import('../app/pages/manage-categories/manage-categories').then(
            (c) => c.ManageCategories
          ),
      },
      {
        path: 'create-product',
        loadComponent: () =>
          import('../app/pages/create-product/create-product').then(
            (c) => c.CreateProduct
          ),
      },
      {
        path: 'manage-products',
        loadComponent: () =>
          import('../app/pages/manage-products/manage-products').then(
            (c) => c.ManageProducts
          ),
      },
      {
        path: 'discounted-products',
        loadComponent: () =>
          import('../app/pages/discounted-products/discounted-products').then(
            (c) => c.DiscountedProducts
          ),
      },
      {
        path: 'expiring-soon',
        loadComponent: () =>
          import('./pages/expiring-soon/expiring-soon').then(
            (c) => c.ExpiringSoon
          ),
      },
      {
        path: 'low-stock',
        loadComponent: () =>
          import('./pages/low-stock/low-stock').then((c) => c.LowStock),
      },
      {
        path: 'manage-cities',
        loadComponent: () =>
          import('../app/pages/manage-cities/manage-cities').then(
            (c) => c.ManageCities
          ),
      },
      {
        path: 'manage-sectors/:cityId',
        loadComponent: () =>
          import('../app/pages/manage-sectors/manage-sectors').then(
            (c) => c.ManageSectors
          ),
      },
      {
        path: 'manage-users',
        loadComponent: () =>
          import('../app/pages/manage-users/manage-users').then(
            (c) => c.ManageUsers
          ),
      },
      {
        path: 'manage-stats',
        loadComponent: () =>
          import('../app/pages/manage-stats/manage-stats').then(
            (c) => c.ManageStats
          ),
      },
    ],
  },
  {
    path: 'seller',
    loadComponent: () =>
      import('../app/layouts/seller-layout/seller-layout').then(
        (c) => c.SellerLayout
      ),
    canActivate: [authGuard('seller')],
    children: [
      { path: '', redirectTo: 'seller-page', pathMatch: 'full' },
      {
        path: 'seller-page',
        loadComponent: () =>
          import('./pages/seller-page/seller-page').then((c) => c.SellerPage),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('../app/pages/change-password/change-password').then(
            (c) => c.ChangePassword
          ),
      },
      {
        path: 'manage-products',
        loadComponent: () =>
          import('../app/pages/manage-products/manage-products').then(
            (c) => c.ManageProducts
          ),
      },
      {
        path: 'discounted-products',
        loadComponent: () =>
          import('../app/pages/discounted-products/discounted-products').then(
            (c) => c.DiscountedProducts
          ),
      },
      {
        path: 'manage-sectors/:cityId',
        loadComponent: () =>
          import('../app/pages/manage-sectors/manage-sectors').then(
            (c) => c.ManageSectors
          ),
      },
      {
        path: 'all-delivery',
        loadComponent: () =>
          import('../app/pages/all-delivery/all-delivery').then(
            (c) => c.AllDelivery
          ),
      },
      {
        path: 'create-client',
        loadComponent: () =>
          import('../app/pages/create-client/create-client').then(
            (c) => c.CreateClient
          ),
      },
      {
        path: 'manage-clients',
        loadComponent: () =>
          import('../app/pages/manage-clients/manage-clients').then(
            (c) => c.ManageClients
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('../app/pages/manage-sales/manage-sales').then(
            (c) => c.ManageSales
          ),
      },
      {
        path: 'manage-orders',
        loadComponent: () =>
          import('../app/pages/manage-orders/manage-orders').then(
            (c) => c.ManageOrders
          ),
      },
      {
        path: 'manage-stats',
        loadComponent: () =>
          import('../app/pages/manage-stats/manage-stats').then(
            (c) => c.ManageStats
          ),
      },
    ],
  },
  {
    path: 'delivery',
    loadComponent: () =>
      import('../app/layouts/delivery-layout/delivery-layout').then(
        (c) => c.DeliveryLayout
      ),
    canActivate: [authGuard('delivery')],
    children: [
      { path: '', redirectTo: 'delivery-page', pathMatch: 'full' },
      {
        path: 'delivery-page',
        loadComponent: () =>
          import('./pages/delivery-page/delivery-page').then(
            (c) => c.DeliveryPage
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('../app/pages/change-password/change-password').then(
            (c) => c.ChangePassword
          ),
      },
      {
        path: 'manage-clients',
        loadComponent: () =>
          import('../app/pages/manage-clients/manage-clients').then(
            (c) => c.ManageClients
          ),
      },
      {
        path: 'manage-sales',
        loadComponent: () =>
          import('../app/pages/manage-sales/manage-sales').then(
            (c) => c.ManageSales
          ),
      },
      {
        path: 'manage-products',
        loadComponent: () =>
          import('../app/pages/manage-products/manage-products').then(
            (c) => c.ManageProducts
          ),
      },
      {
        path: 'manage-orders',
        loadComponent: () =>
          import('../app/pages/manage-orders/manage-orders').then(
            (c) => c.ManageOrders
          ),
      },
    ],
  },
  {
    path: 'instant',
    loadComponent: () =>
      import('../app/layouts/instant-layout/instant-layout').then(
        (c) => c.InstantLayout
      ),
    canActivate: [authGuard('instant')],
    children: [
      { path: '', redirectTo: 'instant-page', pathMatch: 'full' },
      {
        path: 'instant-page',
        loadComponent: () =>
          import('./pages/instant-page/instant-page').then(
            (c) => c.InstantPage
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('../app/pages/change-password/change-password').then(
            (c) => c.ChangePassword
          ),
      },
      {
        path: 'all-products',
        loadComponent: () =>
          import('../app/pages/manage-products/manage-products').then(
            (c) => c.ManageProducts
          ),
      },
      {
        path: 'discounted-products',
        loadComponent: () =>
          import('../app/pages/discounted-products/discounted-products').then(
            (c) => c.DiscountedProducts
          ),
      },
      {
        path: 'manage-sectors/:cityId',
        loadComponent: () =>
          import('../app/pages/manage-sectors/manage-sectors').then(
            (c) => c.ManageSectors
          ),
      },
      {
        path: 'all-sales',
        loadComponent: () =>
          import('../app/pages/manage-sales/manage-sales').then(
            (c) => c.ManageSales
          ),
      },
      {
        path: 'manage-stats',
        loadComponent: () =>
          import('../app/pages/manage-stats/manage-stats').then(
            (c) => c.ManageStats
          ),
      },
    ],
  },
];
