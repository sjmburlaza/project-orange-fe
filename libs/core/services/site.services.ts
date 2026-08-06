import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import {
  normalizeSiteCode,
  SiteCode,
  SiteConfig,
} from '@orange/core/i18n';
import { BrowserStorageService } from './browser-storage.service';
import { map, Observable, tap } from 'rxjs';

type SitesResponse = SiteConfig[] | { sites?: SiteConfig[] | null };
interface SiteEnvelope {
  site?: SiteConfig | null;
}
type SiteResponse = SiteConfig | SiteEnvelope | null;

const FLAG_CODES = new Set(['ph', 'fr', 'cn', 'jp']);

export interface SiteOption {
  code: SiteCode;
  countryName: string;
  flagCode: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SiteService {
  private readonly storageKey = 'orange.sitePreference';
  private readonly endpoint = '/api/sites';
  private readonly browserStorage = inject(BrowserStorageService);
  private readonly injector = inject(Injector);
  private readonly currentSiteSignal = signal<SiteCode | null>(null);
  private readonly siteOrderSignal = signal<SiteCode[]>([]);
  private readonly siteConfigSignal = signal<Record<SiteCode, SiteConfig>>({});

  readonly currentSite = computed(
    () => this.currentSiteSignal() ?? this.defaultSiteCode() ?? '',
  );
  readonly config = computed(() => this.getSiteConfig(this.currentSite()));
  readonly currency = computed(() => this.config()?.currency ?? '');
  readonly sites = computed(() =>
    this.siteOrderSignal()
      .map((site) => this.siteConfigSignal()[site])
      .filter((site): site is SiteConfig => Boolean(site)),
  );
  readonly siteOptions = computed<SiteOption[]>(() =>
    this.sites().map((site) => ({
      code: site.code,
      countryName: site.countryName,
      flagCode: this.getFlagCode(site.code),
    })),
  );

  loadSites(): Observable<SiteConfig[]> {
    return this.http.get<SitesResponse>(this.endpoint).pipe(
      map((response) => this.extractSites(response)),
      tap((sites) => this.setSites(sites)),
    );
  }

  loadSite(site: string | null | undefined): Observable<SiteConfig | null> {
    const siteCode = normalizeSiteCode(site);

    if (!siteCode) {
      throw new Error('A site code is required to load a site config.');
    }

    return this.http.get<SiteResponse>(`${this.endpoint}/${siteCode}`).pipe(
      map((response) => this.extractSite(response)),
      map((siteConfig) => this.normalizeSite(siteConfig)),
      tap((siteConfig) => {
        if (siteConfig) {
          this.upsertSite(siteConfig);
        }
      }),
    );
  }

  setCurrentSite(site: SiteCode): void {
    const siteCode = normalizeSiteCode(site);

    if (!siteCode || !this.isSupportedSite(siteCode)) {
      return;
    }

    this.currentSiteSignal.set(siteCode);
  }

  getCurrentSite(): SiteCode {
    return this.currentSite();
  }

  getPreferredSite(): SiteCode | null {
    const savedSite = normalizeSiteCode(
      this.browserStorage.getItem(this.storageKey),
    );

    if (!savedSite) {
      return null;
    }

    return this.siteOrderSignal().length === 0 || this.isSupportedSite(savedSite)
      ? savedSite
      : null;
  }

  saveSitePreference(site: SiteCode): void {
    if (!this.isSupportedSite(site)) {
      return;
    }

    this.browserStorage.setItem(this.storageKey, site);
  }

  getSiteOptions(): SiteOption[] {
    return this.siteOptions();
  }

  getSiteConfig(site: string | null | undefined): SiteConfig | null {
    const siteCode = normalizeSiteCode(site);
    return siteCode ? (this.siteConfigSignal()[siteCode] ?? null) : null;
  }

  isSupportedSite(site: string | null | undefined): site is SiteCode {
    const siteCode = normalizeSiteCode(site);
    return Boolean(siteCode && this.siteConfigSignal()[siteCode]);
  }

  siteFromCountryCode(countryCode: string | null | undefined): SiteCode | null {
    const siteCode = normalizeSiteCode(countryCode);
    return siteCode && this.isSupportedSite(siteCode) ? siteCode : null;
  }

  isFeatureEnabled(feature: string, site = this.currentSite()): boolean {
    return this.getSiteConfig(site)?.features[feature] === true;
  }

  isAddonEnabled(addonId: string): boolean {
    const featureByAddonId: Record<string, string> = {
      insurance: 'insurance',
      'trade-in': 'tradeIn',
    };
    const feature = featureByAddonId[addonId];

    return feature ? this.isFeatureEnabled(feature) : true;
  }

  private upsertSite(site: SiteConfig): void {
    const siteConfig = {
      ...this.siteConfigSignal(),
      [site.code]: site,
    };
    const siteOrder = this.siteOrderSignal().includes(site.code)
      ? this.siteOrderSignal()
      : [...this.siteOrderSignal(), site.code];

    this.siteConfigSignal.set(siteConfig);
    this.siteOrderSignal.set(siteOrder);

    if (!this.isSupportedSite(this.currentSiteSignal())) {
      this.currentSiteSignal.set(site.code);
    }
  }

  private defaultSiteCode(): SiteCode | null {
    return this.siteOrderSignal()[0] ?? null;
  }

  private setSites(sites: SiteConfig[]): void {
    const siteConfig: Record<SiteCode, SiteConfig> = {};
    const siteOrder: SiteCode[] = [];

    for (const site of sites) {
      const normalizedSite = this.normalizeSite(site);

      if (!normalizedSite || siteConfig[normalizedSite.code]) {
        continue;
      }

      siteConfig[normalizedSite.code] = normalizedSite;
      siteOrder.push(normalizedSite.code);
    }

    this.siteConfigSignal.set(siteConfig);
    this.siteOrderSignal.set(siteOrder);

    if (!this.isSupportedSite(this.currentSiteSignal())) {
      this.currentSiteSignal.set(siteOrder[0] ?? null);
    }
  }

  private extractSites(response: SitesResponse): SiteConfig[] {
    return Array.isArray(response) ? response : (response.sites ?? []);
  }

  private extractSite(response: SiteResponse): SiteConfig | null {
    if (!response) {
      return null;
    }

    return this.isSiteConfig(response) ? response : (response.site ?? null);
  }

  private isSiteConfig(
    response: SiteConfig | SiteEnvelope,
  ): response is SiteConfig {
    return 'code' in response;
  }

  private normalizeSite(site: SiteConfig | null): SiteConfig | null {
    if (!site) {
      return null;
    }

    const code = normalizeSiteCode(site.code);

    if (!code) {
      return null;
    }

    return {
      ...site,
      code,
      features: site.features ?? {},
      supportedLanguages: site.supportedLanguages ?? [],
    };
  }

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  private getFlagCode(site: SiteCode): string | null {
    return FLAG_CODES.has(site) ? site : null;
  }
}
