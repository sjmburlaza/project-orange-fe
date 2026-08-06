import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ROLES } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { emailValidator } from '@orange/shared/validators';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required]],
  });

  hidePassword = true;
  isLoading = false;

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    this.loginForm.setErrors(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (error) => {
          console.error('Admin login failed:', error);

          this.loginForm.setErrors({
            loginFailed: true,
          });
        },
      });
  }

  private handleLoginSuccess(response: AuthSession): void {
    if (!response.user.roles.includes(ROLES.ADMIN)) {
      this.authStore.clearSession();
      this.loginForm.setErrors({
        unauthorized: true,
      });
      return;
    }

    this.authStore.setSession(response);
    this.router.navigateByUrl(this.getPostLoginUrl());
  }

  private getPostLoginUrl(): string {
    return this.getSafeReturnUrl() ?? '/admin/analytics';
  }

  private getSafeReturnUrl(): string | null {
    if (!this.returnUrl?.startsWith('/') || this.returnUrl.startsWith('//')) {
      return null;
    }

    const returnPath = this.returnUrl.split(/[?#]/)[0];
    const isAdminPath =
      returnPath === '/admin' || returnPath.startsWith('/admin/');

    return isAdminPath && returnPath !== '/admin/login' ? this.returnUrl : null;
  }
}
