import { Component, inject, OnInit } from '@angular/core';
import { CartItemComponent } from '../components/cart-item/cart-item.component';
import { CartFacade } from '../store/cart.facade';
import { AsyncPipe } from '@angular/common';
import { AddonComponent } from '../components/addon/addon.component';
import { SiteService } from '@orange/core/services';
import {
  Addon,
  UpdateCartItemAddonRequest,
} from '@orange/core/models';

@Component({
  selector: 'app-cart',
  imports: [AsyncPipe, CartItemComponent, AddonComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  private readonly cartFacade = inject(CartFacade);
  readonly siteService = inject(SiteService);
  readonly items$ = this.cartFacade.items$;
  readonly cartLoading$ = this.cartFacade.loading$;

  ngOnInit(): void {
    this.cartFacade.loadCart();
  }

  removeItem(variantId: number): void {
    this.cartFacade.removeItem(variantId);
  }

  onQuantityChange(data: {
    variantId: number;
    quantity: number;
  }): void {
    if (data.quantity === 0) {
      this.cartFacade.removeItem(data.variantId);
    } else {
      this.cartFacade.updateQuantity(data.variantId, data.quantity);
    }
  }

  onAddonUpsert(data: {
    variantId: number;
    addonId: string;
    request: UpdateCartItemAddonRequest;
  }): void {
    this.cartFacade.upsertItemAddon(
      data.variantId,
      data.addonId,
      data.request,
    );
  }

  onAddonRemove(data: { variantId: number; addonId: string }): void {
    this.cartFacade.removeItemAddon(data.variantId, data.addonId);
  }

  enabledAddons(addons: Addon[]): Addon[] {
    return addons.filter((addon) => this.siteService.isAddonEnabled(addon.id));
  }
}
