import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFieldComponent } from '../dynamic-field.component';
import { DynamicField } from '@orange/core/models';

@Component({
  selector: 'app-array-field',
  imports: [ReactiveFormsModule, forwardRef(() => DynamicFieldComponent)],
  templateUrl: './array-field.component.html',
  styleUrl: './array-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayFieldComponent {
  @Input() field!: DynamicField;
  @Input() form!: FormGroup;

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();

  get array(): FormArray<FormGroup> {
    return this.form.get(this.field.name) as FormArray<FormGroup>;
  }
}
