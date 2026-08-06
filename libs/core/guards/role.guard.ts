import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { AUTH_GUARD_REDIRECTS } from './auth-guard-redirects';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly redirects = inject(AUTH_GUARD_REDIRECTS);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    const requiredRoles = this.readStringArray(route.data['roles']);
    const requiredRole = this.readString(route.data['role']);
    const requiredPermissions = this.readStringArray(route.data['permissions']);

    if (requiredRole) {
      requiredRoles.push(requiredRole);
    }

    const session = this.authStore.getSessionSnapshot();

    if (session) {
      return this.canAccess(requiredRoles, requiredPermissions, state.url);
    }

    if (session === null) {
      return this.loginUrlTree(state.url);
    }

    return this.authService.getSession().pipe(
      tap((currentSession) => this.authStore.setSession(currentSession)),
      map(() => this.canAccess(requiredRoles, requiredPermissions, state.url)),
      catchError(() => {
        this.authStore.clearSession();
        return of(this.loginUrlTree(state.url));
      }),
    );
  }

  private canAccess(
    requiredRoles: readonly string[],
    requiredPermissions: readonly string[],
    returnUrl: string,
  ): boolean | UrlTree {
    const hasRequiredRole =
      requiredRoles.length === 0 || this.authStore.hasAnyRole(requiredRoles);
    const hasRequiredPermissions = this.authStore.hasAllPermissions(
      requiredPermissions,
    );

    return hasRequiredRole && hasRequiredPermissions
      ? true
      : this.unauthorizedUrlTree(returnUrl);
  }

  private loginUrlTree(returnUrl: string): UrlTree {
    return this.redirects.loginUrlTree(this.router, returnUrl);
  }

  private unauthorizedUrlTree(returnUrl: string): UrlTree {
    return this.redirects.unauthorizedUrlTree(this.router, returnUrl);
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private readStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }
}
