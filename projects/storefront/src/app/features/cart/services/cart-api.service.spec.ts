import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserStorageService } from '@orange/core/services';
import { CartApiService } from './cart-api.service';
import { Cart } from '@orange/core/models';
import { ProductConfigure } from '@orange/core/models';

describe('CartApiService', () => {
  let service: CartApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BrowserStorageService,
          useValue: {
            getItem: () => 'cart-123',
            setItem: () => undefined,
            removeItem: () => undefined,
          },
        },
      ],
    });

    service = TestBed.inject(CartApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates quantity using the variant id in the backend URL', () => {
    const cart = createCart();

    service.updateQuantity(1001, { quantity: 2 }).subscribe((response) => {
      expect(response).toEqual(cart);
    });

    const request = httpMock.expectOne('/api/carts/cart-123/items/1001');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ quantity: 2 });

    request.flush(cart);
  });

  it('removes an item using the variant id in the backend URL', () => {
    const cart = createCart();

    service.removeItem(1001).subscribe((response) => {
      expect(response).toEqual(cart);
    });

    const request = httpMock.expectOne('/api/carts/cart-123/items/1001');

    expect(request.request.method).toBe('DELETE');

    request.flush(cart);
  });

  it('upserts an item addon using the variant id in the backend URL', () => {
    const cart = createCart();

    service
      .upsertItemAddon(1001, 'insurance', { insurancePlanCode: 'protect-plus' })
      .subscribe((response) => {
        expect(response).toEqual(cart);
      });

    const request = httpMock.expectOne(
      '/api/carts/cart-123/items/1001/addons/insurance',
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      insurancePlanCode: 'protect-plus',
    });

    request.flush(cart);
  });

  it('removes an item addon using the variant id in the backend URL', () => {
    const cart = createCart();

    service.removeItemAddon(1001, 'insurance').subscribe((response) => {
      expect(response).toEqual(cart);
    });

    const request = httpMock.expectOne(
      '/api/carts/cart-123/items/1001/addons/insurance',
    );

    expect(request.request.method).toBe('DELETE');

    request.flush(cart);
  });

  it('loads recommended products from the active cart URL', () => {
    const products = [createProduct()];

    service.getRecommendedProducts().subscribe((response) => {
      expect(response).toEqual(products);
    });

    const request = httpMock.expectOne(
      '/api/carts/cart-123/recommended-products',
    );

    expect(request.request.method).toBe('GET');

    request.flush(products);
  });
});

function createCart(): Cart {
  return {
    code: 'cart-123',
    entries: [
      {
        productId: 1,
        variantId: 1001,
        productName: 'Orange Phone',
        price: 39999,
        quantity: 2,
        totalPrice: 79998,
        stockQuantity: 8,
        imageUrl: '/assets/phone.png',
        itemSpecs: [],
        addons: [
          {
            id: 'insurance',
            name: 'Device protection',
            title: 'Device protection',
            description: 'Coverage for accidental damage.',
            imageUrl: '',
            isAdded: true,
          },
        ],
      },
    ],
    appliedVouchers: [],
    cartSummary: [{ name: 'Total', amount: 79998 }],
  };
}

function createProduct(): ProductConfigure {
  return {
    id: 2,
    name: 'Orange Watch',
    description: 'A compact wearable',
    price: 12999,
    stockQuantity: 6,
    imageUrl: '/assets/watch.png',
    categoryId: 3,
    categoryName: 'Accessories',
    features: [],
    whatsInTheBox: [],
    optionGroups: [],
    variants: [
      {
        id: 2001,
        sku: 'orange-watch-2001',
        price: 12999,
        stockQuantity: 6,
        stockStatus: 'inStock',
        imageUrl: '/assets/watch.png',
        options: {},
      },
    ],
  };
}
