import type { Permission, Role } from './auth.constants';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  permissions: Permission[];
}

export interface AuthSessionDetails {
  id: string;
  createdAtUtc: string;
  expiresAtUtc: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  resetToken?: string;
  resetUrl?: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  session: AuthSessionDetails;
}
