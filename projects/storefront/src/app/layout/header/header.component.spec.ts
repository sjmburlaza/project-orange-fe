import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, AuthStore } from '@orange/core/auth';
import { firstValueFrom, of } from 'rxjs';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    })
    .compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      common: {
        navigation: {
          home: 'Home',
          shop: 'Shop',
        },
      },
    });
    translate.use('en');

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders Home and Shop before the search component', () => {
    const header = fixture.nativeElement.querySelector('.header') as HTMLElement;
    const navigationLinks = Array.from(
      header.querySelectorAll<HTMLAnchorElement>('.primary-nav a'),
    );
    const navigation = header.querySelector('.primary-nav');
    const search = header.querySelector('app-search');

    expect(navigationLinks.map((link) => link.textContent?.trim())).toEqual([
      'Home',
      'Shop',
    ]);
    expect(navigationLinks[0].getAttribute('href')).toBeTruthy();
    expect(navigationLinks[1].getAttribute('href')).toContain('/products');
    expect(
      (navigation?.compareDocumentPosition(search as Node) ?? 0) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('runs account menu actions for signed-out and signed-in users', async () => {
    const router = TestBed.inject(Router);
    const authService = TestBed.inject(AuthService);
    const authStore = TestBed.inject(AuthStore);
    const navigate = vi.spyOn(router, 'navigate');
    vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));
    vi.spyOn(authStore, 'clearSession');

    authStore.clearSession();
    const signedOutItems = await firstValueFrom(component.accountMenuItems$);
    signedOutItems.forEach((item) => item.action());

    expect(signedOutItems.at(-1)?.label).toBe('Sign In');
    expect(navigate).toHaveBeenCalledWith([
      `/${component.site()}/orders/my-orders`,
    ]);
    expect(navigate).toHaveBeenCalledWith([
      `/${component.site()}/profile/wishlist`,
    ]);
    expect(navigate).toHaveBeenCalledWith([
      `/${component.site()}/profile/account-settings`,
    ]);
    expect(navigate).toHaveBeenCalledWith([`/${component.site()}/auth/login`]);

    authStore.setSession({
      user: {
        id: 'user-1',
        email: 'shopper@example.com',
        fullName: 'Orange Shopper',
        roles: [],
        permissions: [],
      },
      session: {
        id: 'session-1',
        createdAtUtc: '2026-08-20T00:00:00Z',
        expiresAtUtc: '2026-08-21T00:00:00Z',
      },
    });
    const signedInItems = await firstValueFrom(component.accountMenuItems$);
    signedInItems.at(-1)?.action();

    expect(signedInItems.at(-1)?.label).toBe('Sign Out');
    expect(authService.logout).toHaveBeenCalled();
    expect(authStore.clearSession).toHaveBeenCalled();
  });

  it('navigates to the cart and identifies checkout routes', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const url = vi.spyOn(router, 'url', 'get');

    url.mockReturnValue('/ph/products');
    expect(component.isCheckoutRoute).toBe(false);
    url.mockReturnValue('/ph/checkout');
    expect(component.isCheckoutRoute).toBe(true);

    component.goToCart();
    expect(navigate).toHaveBeenCalledWith([`/${component.site()}/cart`]);
  });
});
