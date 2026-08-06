import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthSession,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@orange/core/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';
  private readonly requestOptions = { withCredentials: true };

  login(dto: LoginDto): Observable<AuthSession> {
    return this.http.post<AuthSession>(
      `${this.baseUrl}/login`,
      dto,
      this.requestOptions,
    );
  }

  register(dto: RegisterDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/register`,
      dto,
      this.requestOptions,
    );
  }

  requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.baseUrl}/forgot-password`,
      dto,
      this.requestOptions,
    );
  }

  resetPassword(dto: ResetPasswordDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/reset-password`,
      dto,
      this.requestOptions,
    );
  }

  getSession(): Observable<AuthSession> {
    return this.http.get<AuthSession>(
      `${this.baseUrl}/session`,
      this.requestOptions,
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/logout`,
      {},
      this.requestOptions,
    );
  }
}
