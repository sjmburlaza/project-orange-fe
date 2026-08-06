import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  OrderConfirmation,
  OrderShippingAddress,
  OrderStatus,
  PaymentStatus,
} from '@orange/core/models';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { SiteService } from '@orange/core/services';
import { TranslatePipe } from '@ngx-translate/core';
import { IconPipe } from '@orange/shared/pipes';
import { IconColorPipe } from '@orange/shared/pipes';

type DisplayStatus = OrderStatus | PaymentStatus;

@Component({
  selector: 'app-order-confirmation',
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    IconPipe,
    IconColorPipe,
    TranslatePipe,
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly siteService = inject(SiteService);

  readonly order = signal<OrderConfirmation | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly site = this.siteService.currentSite;
  readonly currency = computed(() => this.siteService.currency() || 'PHP');
  readonly displayItems = computed(() =>
    (this.order()?.items ?? []).map((item) => ({
      addedAddons: (item.addons ?? []).filter((addon) => addon.isAdded),
      item,
      specs: item.itemSpecs
        .map((spec) => spec.value)
        .filter(Boolean)
        .join(', '),
    })),
  );

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');

    if (!orderId) {
      this.errorMessage.set('orders.confirmation.errors.notFound');
      this.isLoading.set(false);
      return;
    }

    this.orderService.getOrder(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('orders.confirmation.errors.loadFailed');
        this.isLoading.set(false);
      },
    });
  }

  statusTone(status: DisplayStatus): string {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'delivered':
        return 'success';
      case 'pending':
      case 'pending_payment':
        return 'warning';
      case 'processing':
      case 'packed':
      case 'shipped':
      case 'out_for_delivery':
      case 'refunded':
        return 'info';
      case 'failed':
      case 'expired':
      case 'payment_failed':
        return 'error';
      case 'cancelled':
      case 'returned':
        return 'neutral';
    }
  }

  addressLines(address: OrderShippingAddress): string[] {
    return [
      address.addressLine1,
      address.addressLine2,
      address.barangay,
      address.city,
      address.region,
      address.postalCode,
      address.country,
    ].filter((line): line is string => Boolean(line));
  }
}
