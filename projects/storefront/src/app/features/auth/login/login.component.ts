import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ROLES } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    TranslatePipe,
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
  private readonly siteService = inject(SiteService);
  private readonly site = this.siteService.currentSite();
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.authStore.setSession(response);
          this.router.navigateByUrl(this.getPostLoginUrl(response));
        },
        error: (error) => {
          console.error('Login failed:', error);

          this.loginForm.setErrors({
            loginFailed: true,
          });
        },
      });
  }

  goToRegister(): void {
    this.router.navigate([`/${this.site}/auth/register`]);
  }

  goToForgotPassword(): void {
    this.router.navigate([`/${this.site}/auth/forgot-password`]);
  }

  private getPostLoginUrl(response: AuthSession): string {
    if (response.user.roles.includes(ROLES.ADMIN)) {
      return `/${this.site}/products`;
    }

    return this.getSafeReturnUrl() ?? `/${this.site}/cart`;
  }

  private getSafeReturnUrl(): string | null {
    if (!this.returnUrl?.startsWith(`/${this.site}/`)) {
      return null;
    }

    return this.returnUrl.startsWith(`//`) ? null : this.returnUrl;
  }
}
