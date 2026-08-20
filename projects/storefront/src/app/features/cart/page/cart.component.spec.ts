import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartComponent } from './cart.component';
import providers from 'src/test-providers';
import { CartFacade } from '../store/cart.facade';
import { SiteService } from '@orange/core/services';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('forwards item, quantity, and addon changes to the cart facade', () => {
    const facade = TestBed.inject(CartFacade);
    vi.spyOn(facade, 'removeItem');
    vi.spyOn(facade, 'updateQuantity');
    vi.spyOn(facade, 'upsertItemAddon');
    vi.spyOn(facade, 'removeItemAddon');

    component.removeItem(1001);
    component.onQuantityChange({ variantId: 1002, quantity: 0 });
    component.onQuantityChange({ variantId: 1003, quantity: 2 });
    component.onAddonUpsert({
      variantId: 1003,
      addonId: 'insurance',
      request: { insurancePlanCode: 'protect-plus' },
    });
    component.onAddonRemove({ variantId: 1003, addonId: 'insurance' });

    expect(facade.removeItem).toHaveBeenNthCalledWith(1, 1001);
    expect(facade.removeItem).toHaveBeenNthCalledWith(2, 1002);
    expect(facade.updateQuantity).toHaveBeenCalledWith(1003, 2);
    expect(facade.upsertItemAddon).toHaveBeenCalledWith(
      1003,
      'insurance',
      { insurancePlanCode: 'protect-plus' },
    );
    expect(facade.removeItemAddon).toHaveBeenCalledWith(1003, 'insurance');
  });

  it('returns only addons enabled for the current site', () => {
    const siteService = TestBed.inject(SiteService);
    vi.spyOn(siteService, 'isAddonEnabled').mockImplementation(
      (addonId) => addonId === 'insurance',
    );
    const addons = [
      {
        id: 'insurance',
        name: 'Protection',
        title: 'Protection',
        description: 'Device coverage',
        imageUrl: '',
        isAdded: false,
      },
      {
        id: 'trade-in',
        name: 'Trade in',
        title: 'Trade in',
        description: 'Exchange a device',
        imageUrl: '',
        isAdded: false,
      },
    ];

    expect(component.enabledAddons(addons)).toEqual([addons[0]]);
  });
});
