import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  AnalyticsDashboard,
  AnalyticsMetricCard,
} from '@orange/core/models';
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import { InfoTooltipComponent } from '@orange/ui/info-tooltip';
import {
  chartColors,
  dashboardLineChartOptions,
} from '../dashboard-chart.utils';
import { barWidth } from '../dashboard-tab.utils';

@Component({
  selector: 'app-revenue-tab',
  imports: [
    InfoTooltipComponent,
    CurrencyPipe,
    DecimalPipe,
    LineChartComponent,
  ],
  templateUrl: './revenue-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueTabComponent implements OnChanges {
  @Input({ required: true }) data!: AnalyticsDashboard;
  @Input({ required: true }) cards!: AnalyticsMetricCard[];
  @Input({ required: true }) currency!: string;
  @Input({ required: true }) maxCategoryRevenue!: number;

  readonly barWidth = barWidth;
  readonly revenueChartOptions: ChartOptions<'line'> =
    dashboardLineChartOptions((value) => this.formatMoney(value));
  revenueChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [],
  };

  ngOnChanges(): void {
    const daily = [...this.data.daily].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );

    this.revenueChartData = {
      labels: daily.map((day) => day.label),
      datasets: [
        {
          label: 'Revenue',
          data: daily.map((day) => day.revenue),
          borderColor: chartColors.orange,
          backgroundColor: chartColors.orangeFill,
          pointBackgroundColor: chartColors.orange,
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }

  private formatMoney(value: number): string {
    try {
      return new Intl.NumberFormat(undefined, {
        currency: this.currency || 'PHP',
        maximumFractionDigits: 0,
        style: 'currency',
      }).format(value);
    } catch {
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
  }
}
