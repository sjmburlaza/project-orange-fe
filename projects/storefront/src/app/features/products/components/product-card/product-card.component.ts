import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Product } from '@orange/core/models';
import { IconPipe } from '@orange/shared/pipes';
import { RatingStarClassPipe } from '@orange/shared/pipes';

@Component({
  selector: 'app-product-card',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    IconPipe,
    RatingStarClassPipe,
    TranslatePipe,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly ratingStarPositions = [1, 2, 3, 4, 5];

  @Input() product!: Product;
  @Input() currency!: string;
  @Input() wishlisted = false;
  @Input() wishlistBusy = false;
  @Output() configureProduct = new EventEmitter<Product>();
  @Output() viewProductDetail = new EventEmitter<Product>();
  @Output() toggleWishlist = new EventEmitter<Product>();

  onConfigureProduct(value: Product): void {
    if (value) {
      this.configureProduct.emit(value);
    }
  }

  onViewProductDetail(value: Product): void {
    if (value) {
      this.viewProductDetail.emit(value);
    }
  }

  onToggleWishlist(value: Product): void {
    if (value && !this.wishlistBusy) {
      this.toggleWishlist.emit(value);
    }
  }
}
