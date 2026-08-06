import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFieldComponent } from '../dynamic-field.component';
import { DynamicField } from '@orange/core/models';

@Component({
  selector: 'app-group-field',
  imports: [
    ReactiveFormsModule,
    forwardRef(() => DynamicFieldComponent),
    CommonModule,
  ],
  templateUrl: './group-field.component.html',
  styleUrl: './group-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFieldComponent {
  @Input() field!: DynamicField;
  @Input() form!: FormGroup;

  get group(): FormGroup {
    return this.form.get(this.field.name) as FormGroup;
  }

  getGridClass(field: DynamicField) {
    const mobile = field.grid?.mobile ?? 12;
    const tablet = field.grid?.tablet ?? mobile;
    const desktop = field.grid?.desktop ?? 6;

    return `col-${mobile} col-md-${tablet} col-lg-${desktop}`;
  }
}
