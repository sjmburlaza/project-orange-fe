import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AuthSession } from '@orange/core/models';

export type AuthSessionState = AuthSession | null | undefined;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly sessionSubject = new BehaviorSubject<AuthSessionState>(
    undefined,
  );

  readonly session$ = this.sessionSubject.asObservable();

  readonly user$ = this.session$.pipe(
    map((session) => session?.user ?? null),
    distinctUntilChanged(),
  );

  readonly isAuthenticated$ = this.session$.pipe(
    map((session) => !!session),
    distinctUntilChanged(),
  );

  setSession(session: AuthSession): void {
    this.sessionSubject.next(session);
  }

  clearSession(): void {
    this.sessionSubject.next(null);
  }

  getSessionSnapshot(): AuthSessionState {
    return this.sessionSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.sessionSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.sessionSubject.value?.user;
    return (
      (user?.roles as readonly string[] | undefined)?.includes(role) ?? false
    );
  }

  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    const user = this.sessionSubject.value?.user;
    return (
      (user?.permissions as readonly string[] | undefined)?.includes(permission) ??
      false
    );
  }

  hasAllPermissions(permissions: readonly string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }
}
