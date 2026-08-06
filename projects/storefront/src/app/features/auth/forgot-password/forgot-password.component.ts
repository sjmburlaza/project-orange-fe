import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';
import { emailValidator } from '@orange/shared/validators';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteService = inject(SiteService);
  private readonly site = this.siteService.currentSite();

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
  });

  isLoading = false;
  isSubmitted = false;
  submittedEmail: string | null = null;
  errorMessageKey: string | null = null;
  resetToken: string | null = null;
  resetUrl: string | null = null;

  get email() {
    return this.forgotPasswordForm.controls.email;
  }

  get hasDevelopmentResetDetails(): boolean {
    return Boolean(this.resetToken || this.resetUrl);
  }

  onSubmit(): void {
    this.errorMessageKey = null;
    this.isSubmitted = false;
    this.submittedEmail = null;
    this.resetToken = null;
    this.resetUrl = null;

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const dto = this.forgotPasswordForm.getRawValue();
    this.isLoading = true;

    this.authService
      .requestPasswordReset(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.isSubmitted = true;
          this.submittedEmail = dto.email;
          this.resetToken = response?.resetToken ?? null;
          this.resetUrl = response?.resetUrl ?? null;
        },
        error: (error) => {
          console.error('Password reset request failed:', error);

          this.errorMessageKey = 'auth.forgotPassword.errors.sendFailed';
        },
      });
  }

  continueToResetPassword(): void {
    if (!this.submittedEmail || !this.resetToken) {
      return;
    }

    this.router.navigate([`/${this.site}/auth/reset-password`], {
      queryParams: {
        email: this.submittedEmail,
        token: this.resetToken,
      },
    });
  }

  goToLogin(): void {
    this.router.navigate([`/${this.site}/auth/login`]);
  }
}
