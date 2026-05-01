import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/api.config';

export interface UserDto {
  userId?: number;
  name?: string;
  email?: string;
  phone?: string;
  outletIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly endpoint = apiUrl('/api/users');

  constructor(private readonly http: HttpClient) {}

  list(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.endpoint);
  }

  get(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.endpoint}/${id}`);
  }

  create(payload: UserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.endpoint, payload);
  }

  update(id: number, payload: UserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

