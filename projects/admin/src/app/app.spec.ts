import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@orange/core/auth';
import { AuthStore } from '@orange/core/auth';
import { App } from './app';

describe('App', () => {
  let authService: { logout: ReturnType<typeof vi.fn> };
  let authStore: { clearSession: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = { logout: vi.fn() };
    authStore = { clearSession: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the admin navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navigationText = compiled.querySelector('nav')?.textContent;

    expect(navigationText).toContain('Analytics');
    expect(navigationText).toContain('Inventory');
    expect(navigationText).toContain('Promotions');
    expect(navigationText).toContain('Customers');
  });

  it('logs out and returns to admin login', () => {
    authService.logout.mockReturnValue(of(void 0));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    getLogoutButton(fixture.nativeElement).click();

    expect(authService.logout).toHaveBeenCalled();
    expect(authStore.clearSession).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });

  it('clears the session and returns to login when logout fails', () => {
    authService.logout.mockReturnValue(
      throwError(() => new Error('Logout failed')),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    getLogoutButton(fixture.nativeElement).click();

    expect(authStore.clearSession).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
    expect(console.error).toHaveBeenCalledWith(
      'Admin logout failed:',
      expect.any(Error),
    );
  });

  function getLogoutButton(element: HTMLElement): HTMLButtonElement {
    const button = element.querySelector<HTMLButtonElement>(
      '.admin-shell__logout',
    );

    expect(button).toBeTruthy();
    return button as HTMLButtonElement;
  }
});
