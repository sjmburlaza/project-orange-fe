import { Component, inject } from '@angular/core';
import { CartFacade } from '../../cart/store/cart.facade';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { SiteService } from '@orange/core/services';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-order-summary',
  imports: [AsyncPipe, CurrencyPipe, TranslatePipe],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss',
})
export class OrderSummaryComponent {
  private readonly cartFacade = inject(CartFacade);
  readonly siteService = inject(SiteService);
  readonly summary$ = this.cartFacade.summary$;
  readonly total$ = this.cartFacade.total$;
  readonly currency = this.siteService.currency;
}
