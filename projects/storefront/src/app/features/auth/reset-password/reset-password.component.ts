import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';
import {
  PASSWORD_NUMBER_PATTERN,
  PASSWORD_SPECIAL_CHARACTER_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
  STRONG_PASSWORD_PATTERN,
} from '@orange/shared/constants';
import { emailValidator } from '@orange/shared/validators';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteService = inject(SiteService);
  private readonly site = this.siteService.currentSite();

  readonly resetPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    token: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(STRONG_PASSWORD_PATTERN),
      ],
    ],
  });

  readonly passwordRules = [
    {
      labelKey: 'auth.passwordRules.atLeast8',
      valid: () => this.newPasswordValue.length >= 8,
    },
    {
      labelKey: 'auth.passwordRules.uppercase',
      valid: () => PASSWORD_UPPERCASE_PATTERN.test(this.newPasswordValue),
    },
    {
      labelKey: 'auth.passwordRules.number',
      valid: () => PASSWORD_NUMBER_PATTERN.test(this.newPasswordValue),
    },
    {
      labelKey: 'auth.passwordRules.special',
      valid: () =>
        PASSWORD_SPECIAL_CHARACTER_PATTERN.test(this.newPasswordValue),
    },
  ];

  isLoading = false;
  isComplete = false;
  errorMessageKey: string | null = null;
  hidePassword = true;

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const email = params.get('email') ?? '';
    const token = params.get('token') ?? params.get('resetToken') ?? '';

    this.resetPasswordForm.patchValue({ email, token });
  }

  get email() {
    return this.resetPasswordForm.controls.email;
  }

  get token() {
    return this.resetPasswordForm.controls.token;
  }

  get newPassword() {
    return this.resetPasswordForm.controls.newPassword;
  }

  get newPasswordValue(): string {
    return this.newPassword.value ?? '';
  }

  onSubmit(): void {
    this.errorMessageKey = null;

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService
      .resetPassword(this.resetPasswordForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.isComplete = true;
        },
        error: (error) => {
          console.error('Password reset failed:', error);

          this.errorMessageKey = 'auth.resetPassword.errors.invalidOrExpired';
        },
      });
  }

  goToForgotPassword(): void {
    this.router.navigate([`/${this.site}/auth/forgot-password`]);
  }

  goToLogin(): void {
    this.router.navigate([`/${this.site}/auth/login`]);
  }
}
