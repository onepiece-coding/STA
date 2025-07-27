import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    request = request.clone({
      setHeaders: {
        authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(request);
};
