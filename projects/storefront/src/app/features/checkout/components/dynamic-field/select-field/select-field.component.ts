import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DynamicField } from '@orange/core/models';

@Component({
  selector: 'app-select-field',
  imports: [MatFormFieldModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFieldComponent {
  @Input() field!: DynamicField;
  @Input() form!: FormGroup;
}
