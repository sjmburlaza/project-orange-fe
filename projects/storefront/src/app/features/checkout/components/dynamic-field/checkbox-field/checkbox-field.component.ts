import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DynamicField } from '@orange/core/models';

@Component({
  selector: 'app-checkbox-field',
  imports: [ReactiveFormsModule, MatCheckboxModule],
  templateUrl: './checkbox-field.component.html',
  styleUrl: './checkbox-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxFieldComponent {
  @Input() field!: DynamicField;
  @Input() form!: FormGroup;
}
