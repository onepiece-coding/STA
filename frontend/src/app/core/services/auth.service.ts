import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { IUser } from '../models/user.model';
import { environment } from '../../../environment';
import { Router } from '@angular/router';
import { SalesService } from './sales.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private salesService = inject(SalesService);

  public _token = signal<string | null>(localStorage.getItem('accessToken'));
  private _currentUser = signal<IUser | null>(null);

  isAuthenticated = computed(() => this._token());
  currentUserSignal = computed(() => this._currentUser());

  constructor() {
    // إذا كان هناك توكن عند الإقلاع، اشترك في جلب بيانات المستخدم
    effect(() => {
      const t = this._token();
      if (t) {
        this.loadCurrentUser().subscribe();
      } else {
        this._currentUser.set(null);
      }
    });
  }

  loadCurrentUser(): Observable<IUser> {
    if (!this._token()) {
      // لا توكن → لا تحميل
      this._currentUser.set(null);
      return of(null as any);
    }
    return this.http
      .get<IUser>(`${environment.API_BASE_URL}/auth/current-user`)
      .pipe(
        tap((user) => {
          this._currentUser.set(user);
        }),
        catchError((error) => {
          console.log('loadCurrentUser():', error);
          this.clearToken();
          this._currentUser.set(null);
          return of(null as any);
        })
      );
  }

  login(
    username: string,
    password: string
  ): Observable<{ accessToken: string; role: string; username: string }> {
    return this.http.post<{
      accessToken: string;
      role: string;
      username: string;
    }>(`${environment.API_BASE_URL}/auth/login`, { username, password });
  }

  logout() {
    this.clearToken();
    this.salesService.sale.set(null);
    this.router.navigateByUrl('/login');
  }

  setToken(token: string) {
    localStorage.setItem('accessToken', token);
    this._token.set(token);
  }

  clearToken() {
    localStorage.removeItem('accessToken');
    this._token.set(null);
    this._currentUser.set(null);
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.API_BASE_URL}/auth/change-password`,
      { currentPassword, newPassword, confirmPassword }
    );
  }
}
