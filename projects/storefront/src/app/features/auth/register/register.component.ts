import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@orange/core/auth';
import { emailValidator } from '@orange/shared/validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { SiteService } from '@orange/core/services';
import {
  PASSWORD_NUMBER_PATTERN,
  PASSWORD_SPECIAL_CHARACTER_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from '@orange/shared/constants';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteService = inject(SiteService);
  private readonly site = this.siteService.currentSite();

  readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly passwordRules = [
    {
      labelKey: 'auth.passwordRules.atLeast6',
      valid: () => this.passwordValue.length >= 6,
    },
    {
      labelKey: 'auth.passwordRules.special',
      valid: () => PASSWORD_SPECIAL_CHARACTER_PATTERN.test(this.passwordValue),
    },
    {
      labelKey: 'auth.passwordRules.number',
      valid: () => PASSWORD_NUMBER_PATTERN.test(this.passwordValue),
    },
    {
      labelKey: 'auth.passwordRules.uppercase',
      valid: () => PASSWORD_UPPERCASE_PATTERN.test(this.passwordValue),
    },
  ];

  submitted = false;
  errorMessageKey: string | null = null;
  isLoading = false;
  hidePassword = true;

  get fullName() {
    return this.registerForm.controls.fullName;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get passwordValue(): string {
    return this.password.value ?? '';
  }

  onSubmit(): void {
    this.errorMessageKey = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService
      .register(this.registerForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.goToLogin();
        },
        error: (error) => {
          console.error('Register failed:', error);

          this.errorMessageKey = this.getRegisterErrorKey(error.error?.code);
        },
      });
  }

  goToLogin(): void {
    this.router.navigate([`/${this.site}/auth/login`]);
  }

  private getRegisterErrorKey(code?: string): string {
    if (code === 'EMAIL_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS') {
      return 'auth.register.errors.emailAlreadyExists';
    }

    return 'auth.register.errors.failed';
  }
}
