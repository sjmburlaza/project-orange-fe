import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteService } from '@orange/core/services';

interface HomeCategory {
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly slug: string;
  readonly icon: string;
  readonly modifier: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly siteService = inject(SiteService);

  readonly site = this.siteService.currentSite;
  readonly categories: readonly HomeCategory[] = [
    {
      nameKey: 'home.categories.phones.name',
      descriptionKey: 'home.categories.phones.description',
      slug: 'phones',
      icon: '/assets/icons/phone.svg',
      modifier: 'phone',
    },
    {
      nameKey: 'home.categories.laptops.name',
      descriptionKey: 'home.categories.laptops.description',
      slug: 'laptops',
      icon: '/assets/icons/laptop.svg',
      modifier: 'laptop',
    },
    {
      nameKey: 'home.categories.monitors.name',
      descriptionKey: 'home.categories.monitors.description',
      slug: 'monitors',
      icon: '/assets/icons/display.svg',
      modifier: 'monitor',
    },
    {
      nameKey: 'home.categories.accessories.name',
      descriptionKey: 'home.categories.accessories.description',
      slug: 'accessories',
      icon: '/assets/icons/headphones.svg',
      modifier: 'accessory',
    },
  ];
}
