import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicField } from '@orange/core/models';
import { GroupFieldComponent } from './group-field/group-field.component';
import { InputFieldComponent } from './input-field/input-field.component';
import { ArrayFieldComponent } from './array-field/array-field.component';
import { CheckboxFieldComponent } from './checkbox-field/checkbox-field.component';
import { SelectFieldComponent } from './select-field/select-field.component';
import { SelectSearchFieldComponent } from './select-search-field/select-search-field.component';

@Component({
  selector: 'app-dynamic-field',
  imports: [
    InputFieldComponent,
    SelectFieldComponent,
    SelectSearchFieldComponent,
    CheckboxFieldComponent,
    ArrayFieldComponent,
    GroupFieldComponent,
  ],
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.scss',
})
export class DynamicFieldComponent {
  @Input({ required: true }) field!: DynamicField;
  @Input({ required: true }) form!: FormGroup;

  isFieldVisible(field: DynamicField): boolean {
    if (!field.visibleIf) {
      return true;
    }

    const dependentControl = this.form.get(field.visibleIf.field);

    return dependentControl?.value === field.visibleIf.value;
  }
}
