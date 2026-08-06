import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ProductSort } from '@orange/core/models';
import {
  RangeSliderComponent,
  RangeValue,
} from '@orange/ui/range-slider';

import {
  FilterDropdownComponent,
  FilterDropdownOption,
} from '@orange/ui/filter-dropdown';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-product-list-toolbar',
  imports: [
    RangeSliderComponent,
    FilterDropdownComponent,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './product-list-toolbar.component.html',
  styleUrl: './product-list-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListToolbarComponent {
  @Input() sortOptions: readonly FilterDropdownOption<ProductSort>[] = [];
  @Input() selectedSort: ProductSort | null = null;
  @Input() defaultSortLabel = '';
  @Input() categoryOptions: readonly FilterDropdownOption<number>[] = [];
  @Input() selectedCategoryId: number | null = null;
  @Input() allCategoriesLabel = '';
  @Input() productsCount = 0;

  @Output() sortChange = new EventEmitter<ProductSort | null>();
  @Output() categoryChange = new EventEmitter<number | null>();
  @Output() priceRangeChange = new EventEmitter<RangeValue>();
  @Output() clearFilters = new EventEmitter();

  readonly priceMin = 0;
  @Input() priceMax: number | null = 0;
  @Input() pricePrefix = '';

  @Input() priceRange: RangeValue | null = {
    min: this.priceMin,
    max: this.priceMin,
  };

  onPriceRangeChange(value: RangeValue): void {
    this.priceRangeChange.emit(value);
  }

  onSortChange(value: ProductSort | null): void {
    this.sortChange.emit(value);
  }

  onCategoryChange(value: number | null): void {
    this.categoryChange.emit(value);
  }
}
