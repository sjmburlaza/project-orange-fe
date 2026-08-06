import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import {
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from '@orange/core/models';
import { SiteService } from '@orange/core/services';
import { IconColorPipe } from '@orange/shared/pipes';
import { IconPipe } from '@orange/shared/pipes';

type DisplayStatus = OrderStatus | PaymentStatus;

interface OrderActionState {
  canCancel: boolean;
  canChangePayment: boolean;
  canPayNow: boolean;
  canTrack: boolean;
  canBuyAgain: boolean;
  canReview: boolean;
  canReturn: boolean;
  canDownloadInvoice: boolean;
}

@Component({
  selector: 'app-order-item',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    IconPipe,
    IconColorPipe,
    TranslatePipe,
  ],
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss',
})
export class OrderItemComponent {
  private readonly siteService = inject(SiteService);

  readonly order = input.required<OrderItem>();
  readonly isExpanded = signal(false);
  readonly currency = computed(() => this.siteService.currency() || 'PHP');
  readonly orderStatusTone = computed(() =>
    this.statusTone(this.order().orderStatus),
  );
  readonly deliveryInfo = computed(() => {
    const order = this.order();

    return {
      date: order.deliveredAt || order.deliveryEstimate,
      isDelivered: Boolean(order.deliveredAt),
      label: order.deliveredAt
        ? 'orders.lookup.deliveredPrefix'
        : 'orders.lookup.estimatedDeliveryPrefix',
    };
  });
  readonly displayItems = computed(() =>
    this.order().items.map((item) => ({
      addedAddons: (item.addons ?? []).filter((addon) => addon.isAdded),
      item,
      specs: item.itemSpecs
        .map((spec) => spec.value)
        .filter(Boolean)
        .join(' • '),
    })),
  );
  readonly orderActions = computed<OrderActionState>(() => {
    const order = this.order();

    return {
      canCancel: [
        'pending_payment',
        'confirmed',
        'processing',
        'packed',
      ].includes(order.orderStatus),
      canChangePayment: order.orderStatus === 'pending_payment',
      canPayNow:
        order.orderStatus === 'pending_payment' ||
        order.paymentStatus === 'pending',
      canTrack: ['shipped', 'out_for_delivery'].includes(order.orderStatus),
      canBuyAgain: ['delivered', 'cancelled', 'refunded', 'returned'].includes(
        order.orderStatus,
      ),
      canReview: order.orderStatus === 'delivered',
      canReturn: order.orderStatus === 'delivered',
      canDownloadInvoice:
        order.orderStatus === 'delivered' && Boolean(order.invoiceUrl),
    };
  });

  setExpanded(isExpanded: boolean): void {
    this.isExpanded.set(isExpanded);
  }

  private statusTone(status: DisplayStatus): string {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'delivered':
        return 'success';
      case 'pending':
      case 'pending_payment':
        return 'warning';
      case 'packed':
      case 'processing':
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
}
