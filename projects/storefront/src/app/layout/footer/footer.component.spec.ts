import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SiteService } from '@orange/core/services';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let currentSite = signal('ph');

  beforeEach(async () => {
    currentSite = signal('ph');

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        {
          provide: SiteService,
          useValue: {
            currentSite,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders footer sections from mock data', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Shop and Learn');
    expect(compiled.textContent).toContain('OrangeCare+');
    expect(compiled.querySelectorAll('.footer__section').length).toBe(5);
  });

  it('prefixes internal links with the active site', () => {
    expect(component.resolveHref('/products')).toBe('/ph/products');
    expect(component.resolveHref('#support')).toBe('#support');
  });

  it('renders site-specific footer mock data', () => {
    currentSite.set('fr');
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Explorer et acheter');
    expect(compiled.textContent).toContain('France');

    currentSite.set('cn');
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('选购与了解');
    expect(compiled.textContent).toContain('中国');

    currentSite.set('jp');
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('製品を見る');
    expect(compiled.textContent).toContain('日本');
  });
});
