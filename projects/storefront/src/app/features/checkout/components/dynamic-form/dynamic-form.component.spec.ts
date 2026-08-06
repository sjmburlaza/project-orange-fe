import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { DynamicField } from '@orange/core/models';
import { AsyncValidatorMapperService } from '../../services/async-validator-mapper.service';
import { DynamicFormComponent } from './dynamic-form.component';

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
      providers: [
        {
          provide: AsyncValidatorMapperService,
          useValue: {
            getValidator: () => null,
          },
        },
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.fields = [];
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('returns null when required fields are invalid', () => {
    component.fields = [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        validators: [{ name: 'required' }, { name: 'email' }],
      },
    ];
    fixture.detectChanges();

    component.form.get('email')?.setValue('');

    expect(component.validateAndGetValue()).toBeNull();
    expect(component.form.get('email')?.touched).toBe(true);
  });

  it('includes disabled fields in the submitted raw value', () => {
    component.fields = [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        defaultValue: 'ada@example.com',
        disabled: true,
        validators: [{ name: 'required' }, { name: 'email' }],
      },
    ];
    fixture.detectChanges();

    expect(component.form.get('email')?.disabled).toBe(true);
    expect(component.validateAndGetValue()).toEqual({
      email: 'ada@example.com',
    });
  });

  it('copies delivery address values into billing address when requested', () => {
    component.fields = createAddressFields();
    fixture.detectChanges();

    component.form.patchValue({
      deliveryAddress: {
        line1: '123 Orange Street',
        city: 'Manila',
        postalCode: '1000',
      },
      billingAddress: {
        sameAsDeliveryAddress: true,
        line1: '',
        city: '',
        postalCode: '',
      },
    });

    expect(component.validateAndGetValue()).toEqual({
      deliveryAddress: {
        line1: '123 Orange Street',
        city: 'Manila',
        postalCode: '1000',
      },
      billingAddress: {
        sameAsDeliveryAddress: true,
        line1: '123 Orange Street',
        city: 'Manila',
        postalCode: '1000',
      },
    });
  });
});

function createAddressFields(): DynamicField[] {
  return [
    {
      type: 'group',
      name: 'deliveryAddress',
      fields: [
        { type: 'text', name: 'line1' },
        { type: 'text', name: 'city' },
        { type: 'text', name: 'postalCode' },
      ],
    },
    {
      type: 'group',
      name: 'billingAddress',
      fields: [
        {
          type: 'checkbox',
          name: 'sameAsDeliveryAddress',
          defaultValue: false,
        },
        { type: 'text', name: 'line1' },
        { type: 'text', name: 'city' },
        { type: 'text', name: 'postalCode' },
      ],
    },
  ];
}
