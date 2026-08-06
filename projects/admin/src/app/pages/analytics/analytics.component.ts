import {
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  AnalyticsDashboardPeriod,
  AnalyticsMetricCard,
} from '@orange/core/models';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';
import { provideCharts } from 'ng2-charts';
import { AnalyticsService } from '@orange/core/services';
import { SiteService } from '@orange/core/services';
import {
  SelectDropdownComponent,
  SelectOption,
} from '@orange/ui/select-dropdown';
import { FunnelTabComponent } from './components/funnel-tab/funnel-tab.component';
import { OrdersTabComponent } from './components/orders-tab/orders-tab.component';
import { OverviewTabComponent } from './components/overview-tab/overview-tab.component';
import { PaymentFailuresTabComponent } from './components/payment-failures-tab/payment-failures-tab.component';
import { RevenueTabComponent } from './components/revenue-tab/revenue-tab.component';
import { TopProductsTabComponent } from './components/top-products-tab/top-products-tab.component';
import { VisitorsTabComponent } from './components/visitors-tab/visitors-tab.component';

@Component({
  selector: 'app-analytics',
  imports: [
    FunnelTabComponent,
    MatTabsModule,
    OrdersTabComponent,
    OverviewTabComponent,
    PaymentFailuresTabComponent,
    RevenueTabComponent,
    SelectDropdownComponent,
    TopProductsTabComponent,
    VisitorsTabComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideCharts({
      registerables: [
        ArcElement,
        BarController,
        BarElement,
        CategoryScale,
        Filler,
        Legend,
        LinearScale,
        LineController,
        LineElement,
        PieController,
        PointElement,
        Tooltip,
      ],
    }),
  ],
})
export class AnalyticsComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly siteService = inject(SiteService);

  readonly periodOptions: readonly SelectOption<AnalyticsDashboardPeriod>[] = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'past-month', label: 'Past month' },
    { value: 'past-year', label: 'Past year' },
    { value: 'from-start', label: 'From the start' },
  ];
  readonly selectedPeriod = signal<AnalyticsDashboardPeriod>('last-7-days');
  readonly dashboard = this.analytics.dashboard;
  readonly currency = computed(() => this.siteService.currency() || 'PHP');
  readonly selectedPeriodLabel = computed(
    () =>
      this.periodOptions.find(
        (option) => option.value === this.selectedPeriod(),
      )?.label ?? 'Last 7 days',
  );
  readonly overviewCards = computed<AnalyticsMetricCard[]>(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Visitors',
        value: this.formatNumber(data.visitors),
        helper: 'Unique visitors',
        info: 'Unique visitors recorded during the selected period.',
      },
      {
        label: 'Product views',
        value: this.formatNumber(data.productViews),
        helper: 'Catalog item views',
        info: 'Total product view events tracked for catalog items.',
      },
      {
        label: 'Add-to-cart rate',
        value: this.formatPercent(data.addToCartRate),
        helper: `${this.formatNumber(data.addToCarts)} add-to-cart events`,
        info: 'Add-to-cart events divided by product view events.',
        tone: 'good',
      },
      {
        label: 'Checkout start rate',
        value: this.formatPercent(data.checkoutStartRate),
        helper: `${this.formatNumber(data.checkoutStarts)} checkout starts`,
        info: 'Checkout starts divided by add-to-cart events.',
      },
      {
        label: 'Purchase conversion',
        value: this.formatPercent(data.purchaseConversionRate),
        helper: `${this.formatNumber(data.purchases)} completed orders`,
        info: 'Completed purchases divided by unique visitors.',
        tone: 'good',
      },
      {
        label: 'Revenue',
        value: this.formatMoney(data.revenue),
        helper: 'Gross sales',
        info: 'Gross sales value from completed purchases.',
        tone: 'good',
      },
      {
        label: 'Average order value',
        value: this.formatMoney(data.averageOrderValue),
        helper: `${this.formatNumber(data.unitsSold)} units sold`,
        info: 'Gross revenue divided by completed purchases.',
      },
      {
        label: 'Cart abandonment',
        value: this.formatPercent(data.cartAbandonmentRate),
        helper: 'Add-to-cart sessions without purchase',
        info: 'Add-to-cart activity that did not convert to purchases.',
        tone: data.cartAbandonmentRate > 0.7 ? 'warning' : 'default',
      },
      {
        label: 'Payment failure rate',
        value: this.formatPercent(data.paymentFailureRate),
        helper: `${this.formatNumber(data.paymentFailures)} failed payments`,
        info: 'Failed payment attempts divided by all payment attempts.',
        tone: data.paymentFailureRate > 0.12 ? 'danger' : 'default',
      },
    ];
  });
  readonly revenueCards = computed<AnalyticsMetricCard[]>(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Revenue',
        value: this.formatMoney(data.revenue),
        helper: this.selectedPeriodLabel(),
        info: 'Gross sales value from completed purchases.',
        tone: 'good',
      },
      {
        label: 'Average order value',
        value: this.formatMoney(data.averageOrderValue),
        helper: 'Revenue divided by purchases',
        info: 'Gross revenue divided by completed purchases.',
      },
      {
        label: 'Revenue per visitor',
        value: this.formatMoney(data.revenue / Math.max(data.visitors, 1)),
        helper: 'Gross revenue efficiency',
        info: 'Gross revenue divided by unique visitors.',
      },
    ];
  });
  readonly orderCards = computed<AnalyticsMetricCard[]>(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Orders',
        value: this.formatNumber(data.purchases),
        helper: 'Completed purchases',
        info: 'Completed purchase events in the selected period.',
      },
      {
        label: 'Units sold',
        value: this.formatNumber(data.unitsSold),
        helper: 'Items in completed orders',
        info: 'Total item quantity across completed purchases.',
      },
      {
        label: 'Cart abandonment',
        value: this.formatPercent(data.cartAbandonmentRate),
        helper: 'Carts not converted',
        info: 'Add-to-cart activity that did not convert to purchases.',
      },
    ];
  });
  readonly visitorCards = computed<AnalyticsMetricCard[]>(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Visitors',
        value: this.formatNumber(data.visitors),
        helper: 'Unique visitor events',
        info: 'Unique visitors recorded during the selected period.',
      },
      {
        label: 'Product views',
        value: this.formatNumber(data.productViews),
        helper: 'Tracked product impressions',
        info: 'Total product view events tracked for catalog items.',
      },
      {
        label: 'Add-to-cart rate',
        value: this.formatPercent(data.addToCartRate),
        helper: 'Add-to-cart events per product view',
        info: 'Add-to-cart events divided by product view events.',
      },
    ];
  });
  readonly paymentCards = computed<AnalyticsMetricCard[]>(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Payment failures',
        value: this.formatNumber(data.paymentFailures),
        helper: 'Failed checkout attempts',
        info: 'Checkout payment attempts that failed.',
        tone: data.paymentFailures > 0 ? 'warning' : 'good',
      },
      {
        label: 'Payment failure rate',
        value: this.formatPercent(data.paymentFailureRate),
        helper: 'Failures among payment attempts',
        info: 'Failed payment attempts divided by purchases plus failures.',
        tone: data.paymentFailureRate > 0.12 ? 'danger' : 'default',
      },
      {
        label: 'Failed value',
        value: this.formatMoney(
          data.paymentFailureEvents.reduce(
            (total, failure) => total + failure.amount,
            0,
          ),
        ),
        helper: 'Recoverable gross value',
        info: 'Cart value associated with failed payment attempts.',
      },
    ];
  });
  readonly maxProductRevenue = computed(() =>
    maxBy(this.dashboard().topProducts, (product) => product.revenue),
  );
  readonly maxCategoryRevenue = computed(() =>
    maxBy(this.dashboard().topCategories, (category) => category.revenue),
  );

  ngOnInit(): void {
    this.loadSelectedDashboard();
  }

  selectPeriod(period: AnalyticsDashboardPeriod | null): void {
    if (!period || period === this.selectedPeriod()) return;

    this.selectedPeriod.set(period);
    this.loadSelectedDashboard();
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatPercent(value: number): string {
    return new Intl.NumberFormat('en', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: this.currency(),
      maximumFractionDigits: 0,
    }).format(value);
  }

  private loadSelectedDashboard(): void {
    this.analytics.loadDashboard(this.selectedPeriod());
  }
}

function maxBy<T>(items: T[], getValue: (item: T) => number): number {
  return Math.max(...items.map(getValue), 1);
}
