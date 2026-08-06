import { DecimalPipe } from '@angular/common';
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
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import { InfoTooltipComponent } from '@orange/ui/info-tooltip';
import {
  chartColors,
  dashboardLineChartOptions,
} from '../dashboard-chart.utils';

@Component({
  selector: 'app-visitors-tab',
  imports: [InfoTooltipComponent, DecimalPipe, LineChartComponent],
  templateUrl: './visitors-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorsTabComponent implements OnChanges {
  @Input({ required: true }) data!: AnalyticsDashboard;
  @Input({ required: true }) cards!: AnalyticsMetricCard[];

  readonly trafficChartOptions: ChartOptions<'line'> =
    dashboardLineChartOptions((value) => this.formatNumber(value));
  trafficChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [],
  };

  ngOnChanges(): void {
    const daily = this.dailyTrend;

    this.trafficChartData = {
      labels: daily.map((day) => day.label),
      datasets: [
        {
          label: 'Visitors',
          data: daily.map((day) => day.visitors),
          borderColor: chartColors.success,
          backgroundColor: chartColors.successFill,
          pointBackgroundColor: chartColors.success,
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: 4,
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Product views',
          data: daily.map((day) => day.productViews),
          borderColor: chartColors.blue,
          backgroundColor: chartColors.blueFill,
          pointBackgroundColor: chartColors.blue,
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: 4,
          tension: 0.35,
          fill: true,
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
