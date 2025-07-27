import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { TMeta } from '../../shared/types/meta.type';
import { IUser } from '../models/user.model';

type TGetUsersResponse = {
  data: IUser[];
  meta: TMeta;
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  createUser(userType: string, formData: any): Observable<IUser> {
    let forBackend: any = {
      username: formData.username,
      password: formData.password,
    };
    if (userType === 'sellers' || userType === 'instant-sellers') {
      forBackend['sectors'] = formData.selectedSectors;
    }
    if (userType === 'delivery') {
      forBackend['deliverySectors'] = formData.selectedSectors;
      forBackend['seller'] = formData.deliverySeller;
    }
    return this.http.post<IUser>(
      `${environment.API_BASE_URL}/users/${userType}`,
      forBackend
    );
  }

  getUsers(
    userType: string,
    page = 1,
    username?: string
  ): Observable<TGetUsersResponse> {
    let params: Record<string, string | number> = { page };
    if (username) params['search'] = username;
    return this.http.get<TGetUsersResponse>(
      `${environment.API_BASE_URL}/users/${userType}`,
      { params }
    );
  }

  getUserById(userType: string, userId: string): Observable<IUser> {
    return this.http.get<IUser>(
      `${environment.API_BASE_URL}/users/${userType}/${userId}`
    );
  }

  updateUser(
    userType: string,
    userId: string,
    formData: any
  ): Observable<IUser> {
    let forBackend: any = {
      password: formData.password,
    };
    if (userType === 'sellers' || userType === 'instant-sellers') {
      forBackend['sectors'] = formData.selectedSectorsToUpdate;
    }
    if (userType === 'delivery') {
      forBackend['deliverySectors'] = formData.selectedSectorsToUpdate;
      if (formData.deliverySellerToUpdate) {
        forBackend['seller'] = formData.deliverySellerToUpdate;
      }
    }
    return this.http.patch<IUser>(
      `${environment.API_BASE_URL}/users/${userType}/${userId}`,
      forBackend
    );
  }

  deleteUser(
    userType: string,
    userId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.API_BASE_URL}/users/${userType}/${userId}`
    );
  }
}
