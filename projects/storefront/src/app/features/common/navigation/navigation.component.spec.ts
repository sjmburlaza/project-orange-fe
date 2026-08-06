import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteService } from '@orange/core/services';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        provideRouter([]),
        { provide: SiteService, useValue: { currentSite: () => 'ph' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
  });

  it('renders the navigation items for the current site', () => {
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.nav-item'),
    );

    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute('href')).toContain('/ph/');
  });
});
