import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SiteService } from '@orange/core/services';
import headerCnMockData from 'src/assets/mock/header/header.cn.json';
import headerFrMockData from 'src/assets/mock/header/header.fr.json';
import headerJpMockData from 'src/assets/mock/header/header.jp.json';
import headerMockData from 'src/assets/mock/header/header.json';

interface NavigationItem {
  displayName: string;
  path?: string;
  queryParams: { category: string } | null;
}

interface NavigationData {
  navItems: NavigationItem[];
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  private readonly siteService = inject(SiteService);
  readonly site = this.siteService.currentSite;

  private readonly navigationBySite: Record<string, NavigationData> = {
    ph: headerMockData as NavigationData,
    fr: headerFrMockData as NavigationData,
    cn: headerCnMockData as NavigationData,
    jp: headerJpMockData as NavigationData,
  };

  readonly navItems = computed(
    () =>
      (this.navigationBySite[this.site()] ?? this.navigationBySite['ph'])
        .navItems,
  );
}
