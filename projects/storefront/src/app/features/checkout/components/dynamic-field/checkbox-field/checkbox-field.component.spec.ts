import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { CheckboxFieldComponent } from './checkbox-field.component';
import { DynamicField } from '@orange/core/models';

describe('CheckboxFieldComponent', () => {
  let component: CheckboxFieldComponent;
  let fixture: ComponentFixture<CheckboxFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckboxFieldComponent);
    component = fixture.componentInstance;
    const field: DynamicField = {
      type: 'checkbox',
      name: 'acceptTerms',
      label: 'Accept terms',
    };

    component.field = field;
    component.form = new FormGroup({
      acceptTerms: new FormControl(false),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
