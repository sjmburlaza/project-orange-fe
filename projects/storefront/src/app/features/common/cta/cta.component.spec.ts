import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { AuthSession } from '@orange/core/models';
import { AuthStore } from '@orange/core/auth';
import { SiteService } from '@orange/core/services';

import { CtaComponent } from './cta.component';

describe('CtaComponent', () => {
  let component: CtaComponent;
  let fixture: ComponentFixture<CtaComponent>;
  let authStore: AuthStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CtaComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: Router, useValue: router },
        { provide: SiteService, useValue: { currentSite: () => 'ph' } },
      ],
    }).compileComponents();

    TestBed.inject(TranslateService).setTranslation('en', {
      common: {
        cta: {
          continueToCheckout: 'Continue to checkout',
          login: 'Login',
          checkoutAsGuest: 'Checkout as guest',
        },
      },
    });

    authStore = TestBed.inject(AuthStore);
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('shows continue to checkout for authenticated users', () => {
    authStore.setSession(createSession());
    createComponent();

    expect(getButtonText()).toEqual(['Continue to checkout']);
  });

  it('shows login and guest checkout for unauthenticated users', () => {
    authStore.clearSession();
    createComponent();

    expect(getButtonText()).toEqual(['Login', 'Checkout as guest']);
  });

  it('navigates to login from the logged-out login CTA', () => {
    authStore.clearSession();
    createComponent();

    getButtons()[0].click();

    expect(router.navigate).toHaveBeenCalledWith(['/ph/auth/login']);
  });

  it('navigates to checkout from the guest checkout CTA', () => {
    authStore.clearSession();
    createComponent();

    getButtons()[1].click();

    expect(router.navigate).toHaveBeenCalledWith(['/ph/checkout']);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function getButtonText(): string[] {
    return getButtons().map((button) => button.textContent?.trim() ?? '');
  }
});

function createSession(): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email: 'user@example.com',
      fullName: 'Sample User',
      roles: ['customer'],
      permissions: [],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}
