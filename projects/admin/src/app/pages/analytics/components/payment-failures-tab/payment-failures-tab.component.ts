import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  AnalyticsDashboard,
  AnalyticsDailyPoint,
  AnalyticsMetricCard,
} from '@orange/core/models';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart.component';
import { InfoTooltipComponent } from '@orange/ui/info-tooltip';
import {
  chartColors,
  dashboardBarChartOptions,
} from '../dashboard-chart.utils';

@Component({
  selector: 'app-payment-failures-tab',
  imports: [
    InfoTooltipComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    BarChartComponent,
  ],
  templateUrl: './payment-failures-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFailuresTabComponent implements OnChanges {
  @Input({ required: true }) data!: AnalyticsDashboard;
  @Input({ required: true }) cards!: AnalyticsMetricCard[];
  @Input({ required: true }) currency!: string;

  readonly failureChartOptions: ChartOptions<'bar'> = dashboardBarChartOptions(
    (value) => this.formatNumber(value),
  );
  failureChartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };

  ngOnChanges(): void {
    const daily = this.dailyTrend;

    this.failureChartData = {
      labels: daily.map((day) => day.label),
      datasets: [
        {
          label: 'Payment failures',
          data: daily.map((day) => day.paymentFailures),
          backgroundColor: chartColors.dangerFill,
          borderColor: chartColors.danger,
          borderRadius: 6,
          borderWidth: 1,
        },
      ],
    };
  }

  get dailyTrend(): AnalyticsDailyPoint[] {
    return [...this.data.daily].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(value);
  }
}
