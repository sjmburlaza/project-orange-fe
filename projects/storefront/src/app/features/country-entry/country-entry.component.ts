import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, take } from 'rxjs';
import { SiteCode, SiteConfig } from '@orange/core/i18n';
import { CountryDetectionService } from '@orange/core/services';
import { SiteService } from '@orange/core/services';

@Component({
  selector: 'app-country-entry',
  imports: [MatIconModule],
  templateUrl: './country-entry.component.html',
  styleUrl: './country-entry.component.scss',
})
export class CountryEntryComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly countryDetectionService = inject(CountryDetectionService);
  private readonly siteService = inject(SiteService);

  readonly isResolving = signal(true);
  readonly detectedCountryCode = signal<string | null>(null);
  readonly suggestedSite = signal<SiteCode | null>(null);
  readonly siteOptions = this.siteService.siteOptions;
  readonly suggestedOption = computed(
    () =>
      this.siteOptions().find(
        (option) => option.code === this.suggestedSite(),
      ) ?? null,
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ensureSiteOptions()
      .pipe(take(1))
      .subscribe(() => this.resolveSite());
  }

  chooseSite(site: SiteCode): void {
    this.siteService.saveSitePreference(site);
    this.redirectToSite(site);
  }

  private resolveSite(): void {
    const preferredSite = this.siteService.getPreferredSite();

    if (preferredSite) {
      this.redirectToSiteIfAvailable(preferredSite);
      return;
    }

    this.countryDetectionService
      .detectCountryCode()
      .pipe(take(1))
      .subscribe((countryCode) => {
        this.detectedCountryCode.set(countryCode);
        const suggestedSite = this.siteService.siteFromCountryCode(countryCode);

        if (!suggestedSite && countryCode && !this.siteService.sites().length) {
          this.loadSuggestedSite(countryCode);
          return;
        }

        this.suggestedSite.set(suggestedSite);
        this.isResolving.set(false);
      });
  }

  private redirectToSite(site: SiteCode): void {
    this.siteService.setCurrentSite(site);
    void this.router.navigate(['/', site], { replaceUrl: true });
  }

  private ensureSiteOptions(): Observable<SiteConfig[]> {
    const sites = this.siteService.sites();

    if (sites.length) {
      return of(sites);
    }

    return this.siteService.loadSites().pipe(catchError(() => of([])));
  }

  private redirectToSiteIfAvailable(site: SiteCode): void {
    this.ensureSiteConfig(site)
      .pipe(take(1))
      .subscribe((isAvailable) => {
        if (isAvailable) {
          this.redirectToSite(site);
          return;
        }

        this.isResolving.set(false);
      });
  }

  private loadSuggestedSite(countryCode: string): void {
    this.ensureSiteConfig(countryCode)
      .pipe(take(1))
      .subscribe((isAvailable) => {
        const site = isAvailable
          ? this.siteService.siteFromCountryCode(countryCode)
          : null;

        this.suggestedSite.set(site);
        this.isResolving.set(false);
      });
  }

  private ensureSiteConfig(site: SiteCode): Observable<boolean> {
    if (this.siteService.isSupportedSite(site)) {
      return of(true);
    }

    return this.siteService.loadSite(site).pipe(
      map((config) => Boolean(config)),
      catchError(() => of(false)),
    );
  }
}
