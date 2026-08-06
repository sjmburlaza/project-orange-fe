import { Component, computed, inject } from '@angular/core';
import { SiteService } from '@orange/core/services';
import footerCnMockData from 'src/assets/mock/footer/footer.cn.json';
import footerFrMockData from 'src/assets/mock/footer/footer.fr.json';
import footerJpMockData from 'src/assets/mock/footer/footer.jp.json';
import footerMockData from 'src/assets/mock/footer/footer.json';

interface FooterLink {
  label: string;
  href: string;
  icon?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterContact {
  text: string;
  label: string;
  href: string;
}

interface FooterData {
  brand: string;
  intro: string;
  contact: FooterContact;
  sections: FooterSection[];
  socialLinks: FooterLink[];
  finePrint: string[];
  localeLabel: string;
  legalLinks: FooterLink[];
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly siteService = inject(SiteService);

  private readonly footerBySite: Record<string, FooterData> = {
    ph: footerMockData as FooterData,
    fr: footerFrMockData as FooterData,
    cn: footerCnMockData as FooterData,
    jp: footerJpMockData as FooterData,
  };

  readonly footer = computed(
    () => this.footerBySite[this.siteService.currentSite()] ?? this.footerBySite['ph'],
  );
  readonly currentYear = new Date().getFullYear();

  resolveHref(href: string): string {
    if (!href.startsWith('/')) {
      return href;
    }

    const site = this.siteService.currentSite();

    return site ? `/${site}${href}` : href;
  }
}
