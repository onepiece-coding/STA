import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, Observable, of } from 'rxjs';

export const gloablGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return true;

  return authService.loadCurrentUser().pipe(
    map((user) => {
      return router.createUrlTree([`/${user?.role}`]);
    }),
    catchError(() => {
      authService.clearToken();
      return of(router.createUrlTree(['/login']));
    })
  );
};

export function authGuard(
  role: 'admin' | 'seller' | 'delivery' | 'instant'
): CanActivateFn {
  return (
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): UrlTree | Observable<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    return auth.loadCurrentUser().pipe(
      map((user) => {
        if (user?.role === role) return true;
        return router.createUrlTree(['/']);
      }),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
}
