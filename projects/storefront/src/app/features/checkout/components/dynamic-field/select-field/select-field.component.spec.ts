import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { SelectFieldComponent } from './select-field.component';
import { DynamicField } from '@orange/core/models';

describe('SelectFieldComponent', () => {
  let component: SelectFieldComponent;
  let fixture: ComponentFixture<SelectFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
    const field: DynamicField = {
      type: 'select',
      name: 'shippingMethod',
      label: 'Shipping method',
      options: [{ label: 'Standard', value: 'standard' }],
    };

    component.field = field;
    component.form = new FormGroup({
      shippingMethod: new FormControl('standard'),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
