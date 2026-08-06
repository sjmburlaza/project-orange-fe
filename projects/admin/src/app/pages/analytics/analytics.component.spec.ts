import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  AnalyticsDashboard,
  AnalyticsDashboardPeriod,
} from '@orange/core/models';
import { SelectDropdownComponent } from '@orange/ui/select-dropdown';

import { AnalyticsComponent } from './analytics.component';

describe('AnalyticsComponent', () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const req = http.expectOne(
      (request) =>
        request.url === '/api/admin/analytics/dashboard' &&
        request.params.get('period') === 'last-7-days',
    );

    expect(req.request.method).toBe('GET');
    req.flush(createDashboard());
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows period options and reloads dashboard when a period is selected', () => {
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(
      By.directive(SelectDropdownComponent),
    ).componentInstance as SelectDropdownComponent<AnalyticsDashboardPeriod>;

    expect(dropdown.label).toBe('Period');
    expect(dropdown.selectedValue).toBe('last-7-days');
    expect(dropdown.options.map((option) => option.label)).toEqual([
      'Last 7 days',
      'Past month',
      'Past year',
      'From the start',
    ]);

    dropdown.onSelectionChange('past-year');

    const req = http.expectOne(
      (request) =>
        request.url === '/api/admin/analytics/dashboard' &&
        request.params.get('period') === 'past-year',
    );

    expect(req.request.method).toBe('GET');
    req.flush(createDashboard());
    fixture.detectChanges();

    expect(component.selectedPeriod()).toBe('past-year');
  });
});

function createDashboard(): AnalyticsDashboard {
  return {
    visitors: 0,
    productViews: 0,
    addToCarts: 0,
    checkoutStarts: 0,
    purchases: 0,
    revenue: 0,
    averageOrderValue: 0,
    addToCartRate: 0,
    checkoutStartRate: 0,
    purchaseConversionRate: 0,
    cartAbandonmentRate: 0,
    paymentFailures: 0,
    paymentFailureRate: 0,
    unitsSold: 0,
    daily: [],
    funnel: [],
    topProducts: [],
    topCategories: [],
    orders: [],
    paymentFailureEvents: [],
  };
}
