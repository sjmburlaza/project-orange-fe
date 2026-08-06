import { Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { OrderItem } from '@orange/core/models';
import { OrderItemComponent } from 'src/app/features/orders/components/order-item/order-item.component';

@Component({
  selector: 'app-orders-history',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    OrderItemComponent,
    TranslatePipe,
  ],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.scss',
})
export class OrdersHistoryComponent {
  readonly orders = input<OrderItem[]>([]);
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly searchTerm = signal('');
  readonly hasSearchTerm = computed(() => this.searchTerm().trim().length > 0);
  readonly filteredOrders = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();

    if (!searchTerm) {
      return this.orders();
    }

    return this.orders().filter((order) =>
      order.orderNumber.toLowerCase().includes(searchTerm),
    );
  });

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}
