import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AnalyticsDashboard } from '@orange/core/models';
import { barWidth } from '../dashboard-tab.utils';

@Component({
  selector: 'app-top-products-tab',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './top-products-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProductsTabComponent {
  @Input({ required: true }) data!: AnalyticsDashboard;
  @Input({ required: true }) currency!: string;
  @Input({ required: true }) maxProductRevenue!: number;

  readonly barWidth = barWidth;
}
