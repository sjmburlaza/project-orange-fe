import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, finalize, map } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { BackToTopComponent } from '@orange/ui/back-to-top';

@Component({
  selector: 'app-root',
  imports: [
    BackToTopComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isLoginRoute = computed(
    () => this.currentUrl().split('?')[0] === '/admin/login',
  );

  isLoggingOut = false;

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.isLoggingOut = false;
          this.authStore.clearSession();
          void this.router.navigateByUrl('/admin/login');
        }),
      )
      .subscribe({
        error: (error) => {
          console.error('Admin logout failed:', error);
        },
      });
  }
}
