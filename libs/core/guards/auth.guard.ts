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
export class AuthGuard implements CanActivate {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly redirects = inject(AUTH_GUARD_REDIRECTS);

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    const session = this.authStore.getSessionSnapshot();

    if (session) {
      return true;
    }

    if (session === null) {
      return this.loginUrlTree(state.url);
    }

    return this.authService.getSession().pipe(
      tap((currentSession) => this.authStore.setSession(currentSession)),
      map(() => true),
      catchError(() => {
        this.authStore.clearSession();
        return of(this.loginUrlTree(state.url));
      }),
    );
  }

  private loginUrlTree(returnUrl: string): UrlTree {
    return this.redirects.loginUrlTree(this.router, returnUrl);
  }
}
