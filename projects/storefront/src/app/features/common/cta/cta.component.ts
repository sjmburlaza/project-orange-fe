import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-cta',
  imports: [AsyncPipe, MatButtonModule, TranslatePipe],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss',
})
export class CtaComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  readonly siteService = inject(SiteService);
  readonly site = this.siteService.currentSite();
  readonly isAuthenticated$ = this.authStore.isAuthenticated$;

  onLogin(): void {
    this.router.navigate([`/${this.site}/auth/login`]);
  }

  onCheckout(): void {
    this.router.navigate([`/${this.site}/checkout`]);
  }
}
